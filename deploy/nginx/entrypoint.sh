#!/bin/sh
# Render the nginx config from templates at container start, then exec nginx.
#
# Why at startup rather than build: the OpenSearch hostname and credential come
# from a Kubernetes Secret. Baking them into the image would put a credential in
# a layer (recoverable with `docker history`) and tie the image to one venue.
set -eu

: "${OS_HOST:?OS_HOST must be set (OpenSearch domain hostname, no scheme)}"
: "${OS_USER:?OS_USER must be set}"
: "${OS_PASS:?OS_PASS must be set}"
OS_SSL_VERIFY="${OS_SSL_VERIFY:-on}"

# Build the Basic auth value here so the plaintext password is never written
# into a config file on disk -- only the base64 blob is, and only in the
# container's own filesystem.
OS_AUTH_B64="$(printf '%s:%s' "$OS_USER" "$OS_PASS" | base64 | tr -d '\n')"
export OS_HOST OS_AUTH_B64 OS_SSL_VERIFY

TPL=/etc/nginx/templates
OUT=/etc/nginx/conf.d

# Substitute ONLY our own placeholders. Without this allowlist, envsubst would
# also eat nginx's own $uri, $proxy_add_x_forwarded_for and friends.
VARS='${OS_HOST} ${OS_AUTH_B64} ${OS_SSL_VERIFY}'

envsubst "$VARS" < "$TPL/opensearch_upstream.conf.template" > /etc/nginx/opensearch_upstream.conf
envsubst "$VARS" < "$TPL/default.conf.template"             > "$OUT/default.conf"

# Never let the rendered credential be world-readable inside the container.
chmod 600 /etc/nginx/opensearch_upstream.conf 2>/dev/null || true

echo "[entrypoint] rendered nginx config for upstream https://${OS_HOST} as ${OS_USER}"
echo "[entrypoint] TLS verification: ${OS_SSL_VERIFY}"

# Fail fast with a readable error rather than crash-looping opaquely.
if ! nginx -t; then
  echo "[entrypoint] FATAL: nginx rejected the rendered config (above)." >&2
  exit 1
fi

# ENTRYPOINT_CHECK_ONLY lets the Dockerfile run everything above at BUILD time,
# as the same unprivileged user that will run in production, and fail the build
# instead of shipping an image that crash-loops. `nginx -t` exercises more than
# syntax: it opens the pid file and log paths, which is how a non-writable
# /run/nginx.pid gets caught.
if [ "${ENTRYPOINT_CHECK_ONLY:-0}" = "1" ]; then
  echo "[entrypoint] check-only mode: render + nginx -t passed, not starting nginx"
  exit 0
fi

exec nginx -g 'daemon off;'
