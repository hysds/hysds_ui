# syntax=docker/dockerfile:1
#
# hysds_ui image for on-prem Kubernetes. See deploy/README.md.
#
# Base images are ARGs so they can be pulled from an internal mirror rather
# than Docker Hub:
#   docker build \
#     --build-arg NODE_IMAGE=registry.jpl.nasa.gov/dockerhub/node:20-bookworm-slim \
#     --build-arg NGINX_IMAGE=registry.jpl.nasa.gov/dockerhub/nginx:1.27-alpine \
#     -t registry.jpl.nasa.gov/eagle-vswir/hysds_ui:0.1.0 .

ARG NODE_IMAGE=node:20-bookworm-slim
ARG NGINX_IMAGE=nginx:1.27-alpine

# ============================= build ==========================================
FROM ${NODE_IMAGE} AS build

# webpack 4 hashes modules with MD4, which OpenSSL 3 removed from the default
# provider -- without this the build dies with ERR_OSSL_EVP_UNSUPPORTED.
# Verified working on Node 20 and 26. Setting output.hashFunction instead is NOT
# sufficient: webpack 4.41 hardcodes createHash("md4") in ConcatenatedModule,
# SplitChunksPlugin, NamedModulesPlugin, ModuleFilenameHelpers and
# SourceMapDevToolPlugin, and terser-webpack-plugin does too, so production
# builds would still fail.
#
# If you pin NODE_IMAGE to node:13 or older instead, this flag does not exist
# and node refuses to start -- build with --build-arg NODE_OPTS="" in that case.
ARG NODE_OPTS="--openssl-legacy-provider"
ENV NODE_OPTIONS=${NODE_OPTS}

WORKDIR /usr/src/app

# Dependencies first so edits to src/ don't invalidate the npm layer.
COPY package.json package-lock.json ./

# scripts/ must be present BEFORE npm ci: package.json's postinstall runs
# scripts/patch-reactivecore.js, so installing without it fails with
# "Cannot find module /usr/src/app/scripts/patch-reactivecore.js".
# It is one rarely-changing file that uses only Node builtins and only writes
# inside node_modules, so copying it here costs no meaningful cache churn.
COPY scripts/ ./scripts/

# `npm ci` honours the lockfile exactly, which `npm install` does not -- it
# rewrote package-lock.json in place when run with a newer npm.
# --ignore-scripts is deliberately NOT used: postinstall applies the
# reactivecore patch. See the verification step below.
RUN npm ci --no-audit --no-fund

COPY . .

# Production config. src/config/index.js is excluded by .dockerignore so a
# developer's localhost settings can never end up in a deployed bundle; this is
# the only thing that supplies it.
COPY deploy/config/index.prod.js src/config/index.js

# tosca.js / figaro.js are gitignored but present in the build context. figaro.js
# is required even though Figaro is unused -- src/pages/Figaro and
# src/components/FigaroResultsList import it, so webpack fails without it.
RUN test -f src/config/tosca.js  || (echo "FATAL: src/config/tosca.js missing"  && exit 1) \
 && test -f src/config/figaro.js || (echo "FATAL: src/config/figaro.js missing" && exit 1)

# Guard against a credential reaching the bundle. .dockerignore should keep
# local-proxy/ out entirely, but verify rather than trust -- this is the last
# point before the secret would become part of a distributable artifact.
# Patterns, not literal credentials -- this file is tracked in git, so the real
# username/password must not appear here either.
RUN if [ -e local-proxy/proxy.env ] || ls -1 *.env 2>/dev/null | grep -qv '\.example$'; then \
      echo "FATAL: a .env file is in the build context. Check .dockerignore." >&2; exit 1; \
    fi \
 && if grep -rIlE '(OS_PASS|password)[[:space:]]*[:=][[:space:]]*["'"'"'][^"'"'"']+' src/ 2>/dev/null | grep -q .; then \
      echo "FATAL: something resembling a credential is assigned in src/ -- refusing to build." >&2; \
      grep -rnIE '(OS_PASS|password)[[:space:]]*[:=][[:space:]]*["'"'"'][^"'"'"']+' src/ >&2; exit 1; \
    fi

RUN npm run build

# The reactivecore patch fixes a stale-results bug. npm can skip lifecycle
# scripts silently in some configurations, and an unpatched bundle looks
# identical, so assert the patch landed rather than assuming it.
RUN grep -q "_msearchSeq" node_modules/@appbaseio/reactivecore/lib/actions/query.js \
 && npm test

# ============================= runtime ========================================
FROM ${NGINX_IMAGE}

# nginx:1.13.12-alpine (the previous base) was released in 2018 and carries a
# long list of published CVEs. 1.27-alpine is current.

RUN apk add --no-cache gettext ca-certificates && update-ca-certificates

COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Explicit --chmod, NOT `RUN chmod +x`. COPY preserves the source file's mode,
# and these arrive as 0600 from the build context. `chmod +x` on 0600 gives
# 0711 -- executable by everyone but readable only by root. A shell script
# needs READ permission to be interpreted (the kernel reads the shebang), so
# the unprivileged USER below failed with
# "/bin/sh: can't open '/usr/local/bin/entrypoint.sh': Permission denied".
# Create the directory FIRST with a traversable mode. `COPY --chmod=0644` also
# applies 0644 to any parent directory it has to create, and a directory
# without the execute bit cannot be traversed -- so the templates inside became
# unreadable ("can't open /etc/nginx/templates/...: Permission denied") even
# though the files themselves were 0644 and owned by uid 101. Root bypasses
# this via CAP_DAC_OVERRIDE, which is why a build-time check as root missed it.
RUN mkdir -p /etc/nginx/templates && chmod 0755 /etc/nginx/templates

COPY --chmod=0644 deploy/nginx/default.conf.template              /etc/nginx/templates/default.conf.template
COPY --chmod=0644 deploy/nginx/opensearch_upstream.conf.template  /etc/nginx/templates/opensearch_upstream.conf.template
COPY --chmod=0755 deploy/nginx/entrypoint.sh                      /usr/local/bin/entrypoint.sh

# Normalise, then assert. Both earlier failures were invisible to a root-side
# `test -r`, because root ignores permission bits -- so check the bits
# themselves. Two distinct things must hold for an unprivileged process:
#   files must be world-READABLE (last octal digit >= 4), and
#   every directory on the path must be world-EXECUTABLE/traversable (1,3,5,7).
RUN chmod 0755 /etc/nginx/templates /etc/nginx/conf.d \
 && chmod 0644 /etc/nginx/templates/*.template \
 && for d in /etc/nginx /etc/nginx/templates /etc/nginx/conf.d /usr/local/bin /usr/share/nginx/html; do \
      mode=$(stat -c '%a' "$d"); \
      case "$mode" in \
        *1|*3|*5|*7) : ;; \
        *) echo "FATAL: directory $d mode $mode is not traversable by other; files inside will be unreadable" >&2; exit 1 ;; \
      esac; \
    done \
 && for f in /etc/nginx/templates/default.conf.template \
             /etc/nginx/templates/opensearch_upstream.conf.template; do \
      mode=$(stat -c '%a' "$f"); \
      case "$mode" in \
        *4|*5|*6|*7) : ;; \
        *) echo "FATAL: $f mode $mode is not world-readable" >&2; exit 1 ;; \
      esac; \
    done \
 && mode=$(stat -c '%a' /usr/local/bin/entrypoint.sh) \
 && case "$mode" in \
      *5|*7) echo "permissions verified: entrypoint $mode, templates and dirs reachable by uid 101" ;; \
      *) echo "FATAL: entrypoint mode $mode lacks world read+execute" >&2; exit 1 ;; \
    esac

# Drop the stock config so it cannot shadow ours.
RUN rm -f /etc/nginx/conf.d/default.conf

# Run unprivileged. Port 8080 rather than 80 because a non-root process cannot
# bind below 1024 -- the Service maps 80 -> 8080.
#
# These substitutions are whitespace-agnostic and ASSERTED. An earlier version
# matched a literal `pid        /var/run/nginx.pid;`; the real file's spacing
# differed, the sed silently did nothing, and nginx died at runtime with
# `open() "/run/nginx.pid" failed (13: Permission denied)` -- /var/run is a
# symlink to /run on Alpine. A sed that doesn't match is not an error, so it
# has to be checked.
RUN sed -i -E 's|^[[:space:]]*user[[:space:]]+[^;]+;|# user directive removed: running unprivileged|' /etc/nginx/nginx.conf \
 && sed -i -E 's|^[[:space:]]*pid[[:space:]]+[^;]+;|pid /tmp/nginx.pid;|' /etc/nginx/nginx.conf \
 && grep -q '^pid /tmp/nginx.pid;' /etc/nginx/nginx.conf \
      || { echo "FATAL: pid directive was not rewritten; nginx.conf contains:" >&2; grep -n 'pid' /etc/nginx/nginx.conf >&2; exit 1; } \
 && if grep -qE '^[[:space:]]*user[[:space:]]' /etc/nginx/nginx.conf; then \
      echo "FATAL: user directive still present" >&2; grep -n 'user' /etc/nginx/nginx.conf >&2; exit 1; \
    fi \
 && mkdir -p /var/cache/nginx \
 && chown -R 101:101 /var/cache/nginx /etc/nginx /usr/share/nginx/html \
 && echo "nginx.conf rewritten for unprivileged operation: ok"

USER 101

# Validate the real rendered config as the real runtime user, at build time.
#
# OS_HOST=localhost, not a fake domain: nginx resolves `proxy_pass` hostnames
# when it LOADS the config, so an unresolvable name fails `nginx -t` with
# "host not found in upstream" and would break the build for the wrong reason.
# localhost resolves from /etc/hosts with no DNS and no connection attempt.
RUN ENTRYPOINT_CHECK_ONLY=1 \
    OS_HOST=localhost \
    OS_USER=builduser \
    OS_PASS=buildpass \
    /usr/local/bin/entrypoint.sh \
 && rm -f /etc/nginx/conf.d/default.conf /etc/nginx/opensearch_upstream.conf \
 && echo "build-time config validation passed; removed test render"

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
