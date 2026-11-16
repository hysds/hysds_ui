# Deploying hysds_ui to on-prem Kubernetes (Rancher)

Target: the Rancher cluster at `airflowsds-mgmt.jpl.nasa.gov`. HTTP-only
ingress, image from an internal registry, read-only OpenSearch proxy.

## Read this first

**The on-prem → AWS network path is confirmed working** (2026-11-16). The
precheck Job in step 5, run from inside the `eagle` namespace, resolved the
`vpc-*` endpoint to private IPs in `100.104.44.x`, connected on 443,
authenticated, and returned a real count — so both DirectConnect/VPN routing
and AWS private-DNS forwarding are in place for this cluster. Re-run that Job
if the UI ever comes up empty; it distinguishes DNS, routing, auth and index
problems, which all look identical from the browser.

**The map is a known-broken feature.** Footprints don't render yet and we were
mid-diagnosis when this deployment work started. Everything else — facet
search, results table, metadata view — is expected to work. Either finish that
debugging first or demo with the map collapsed.

## How the pieces fit

hysds_ui is a **static SPA**: the browser queries OpenSearch directly. That
drives the whole design.

```
browser ──▶ ingress ──▶ nginx (in pod) ──┬──▶ static bundle from /usr/share/nginx/html
                                          └──▶ /grq_es/* ──▶ https://<OS_HOST> (AWS)
                                                 + Authorization from a Secret
                                                 + read-only allowlist
```

Three consequences worth internalizing:

1. **The credential cannot live in the app config.** Anything in `src/config/`
   is compiled into `index_bundle.js` and served to every visitor. It lives in
   a Kubernetes Secret, read by `entrypoint.sh`, rendered into the nginx config
   at container start.
2. **The image is environment-agnostic.** `deploy/config/index.prod.js` sets
   `GRQ_ES_URL = "/grq_es"` — a same-origin relative path. The browser asks its
   own origin; nginx decides where that goes. The same image works in any venue.
3. **Some config is build-time only.** webpack inlines `src/config/*.js`, so
   `GRQ_ES_INDICES`, `VENUE` and `ROOT_PATH` need an image rebuild to change,
   not just a redeploy.

## 1. Build and push

This machine has **Rancher Desktop with the containerd backend**, not Docker
Desktop — there is no Docker daemon, so use `nerdctl`. (A leftover
`desktop-linux` docker context exists and points at a socket that isn't there;
ignore it.) Rancher Desktop must be running.

```sh
cd ~/github_repos/hysds_ui
export PATH="$HOME/.rd/bin:$PATH"

nerdctl info | head -5    # confirms the VM is up

# One-time on Apple Silicon: register QEMU so an amd64 build can run in the
# arm64 VM. Without it the first RUN fails with "exec format error".
nerdctl run --privileged --rm tonistiigi/binfmt --install amd64

nerdctl login artifactory.jpl.nasa.gov:16001    # API token, not your password

nerdctl build --platform=linux/amd64 \
  -t artifactory.jpl.nasa.gov:16001/gov/nasa/jpl/eagle/sds/hysds_ui:0.1.0 .

nerdctl push \
  artifactory.jpl.nasa.gov:16001/gov/nasa/jpl/eagle/sds/hysds_ui:0.1.0
```

Under emulation `npm ci` plus a webpack 4 build takes several minutes. It is
not hung. If that becomes tiresome, building on a native amd64 Linux host
avoids emulation altogether.

**`--platform linux/amd64` is not optional on an Apple Silicon Mac.** Without
it you get an arm64 image, the cluster's amd64 nodes pull it successfully and
then crash-loop with `exec format error` — which reads like an application
fault, not an architecture mismatch. Harmless to pass on an Intel host, so
always pass it.

Use an immutable tag, not `:latest` — it makes rollbacks guesswork.

### Artifactory specifics

JPL Artifactory uses **port-per-repository** Docker addressing. The port
selects the repo, so the repository key never appears in the image path:

| Port | Repository | Use |
|---|---|---|
| `artifactory.jpl.nasa.gov:16001` | `docker-develop-local` | in development — images expected to be deleted after promotion |
| `artifactory.jpl.nasa.gov:16002` | `docker-stage-local` | under testing |
| `artifactory.jpl.nasa.gov:16003` | `docker-release-local` | released |

The **`gov/nasa/jpl/eagle/sds/` path prefix is mandatory.** The
`gov.nasa.jpl.eagle.sds.docker.general` permission target has include pattern
`gov/nasa/jpl/eagle/sds/**`, and a Docker image `a/b/c:tag` occupies the
Artifactory path `a/b/c/tag/`. An image without that prefix is refused even
with Deploy rights.

Authenticate with an Artifactory **API/identity token**, not your account
password — SSO instances reject the password for registry auth.

Three traps that cost a lot of time on 2026-11-12, recorded so nobody repeats
them:

- `gov.nasa.jpl.eagle.sds.docker.general` looks like a repository name but is a
  *permission target*. It is not a valid path component in an image reference.
- **Artifactory returns 404, not 403, for unauthorized Docker paths.** A
  permission or path mistake is therefore indistinguishable from "no registry
  here", which sends you hunting the wrong problem.
- Pushing to `:443` cannot work in any form. There is no Docker endpoint at the
  host root; only `/artifactory/api/docker/<repo>/v2/` responds, and that can't
  be used by Docker clients. Pointing containerd at it with a `hosts.toml` gets
  as far as a successful blob `POST`, then fails: Artifactory replies with a
  `Location` header on the host root and the follow-up `PUT` 405s. Use the
  ports above instead.

To list the real repository keys yourself:

```sh
curl -s -u '<user>' https://artifactory.jpl.nasa.gov/artifactory/api/repositories \
  | python3 -c 'import json,sys; [print(r["key"],r.get("packageType")) for r in json.load(sys.stdin)]' \
  | grep -i docker
```

The base images come from Docker Hub via **your build machine**, not the
cluster; the cluster only pulls the finished app image. So you only need the
`--build-arg` overrides below if the machine doing the build can't reach Docker
Hub:

```sh
nerdctl build --platform=linux/amd64 \
  --build-arg NODE_IMAGE=<mirror>/node:20-bookworm-slim \
  --build-arg NGINX_IMAGE=<mirror>/nginx:1.27-alpine \
  -t artifactory.jpl.nasa.gov:16001/gov/nasa/jpl/eagle/sds/hysds_ui:0.1.0 .
```

The build deliberately fails rather than producing a compromised image if
`local-proxy/proxy.env` or anything resembling a credential is in the context.
`.dockerignore` excludes `local-proxy/` and `src/config/index.js` so a
developer's localhost settings and credentials cannot reach a deployed bundle.

If the build dies with `ERR_OSSL_EVP_UNSUPPORTED`, the `NODE_OPTS` arg isn't
taking effect — webpack 4 hashes with MD4, which OpenSSL 3 dropped. If you pin
an older Node (13 or earlier) the flag doesn't exist and node refuses to start;
build with `--build-arg NODE_OPTS=""` in that case.

## 2. Point kubectl at Rancher

Do this first and verify it, because a default kubectl context is often a local
Docker Desktop cluster — and a stray `apply` against the wrong cluster is a
confusing failure to unpick.

Download the kubeconfig from the Rancher UI at `airflowsds-mgmt.jpl.nasa.gov`
(cluster view → **Download KubeConfig**), then keep it as its own file rather
than overwriting `~/.kube/config`:

```sh
mkdir -p ~/.kube/configs     # save the download as ~/.kube/configs/airflowsds.yaml

export KUBECONFIG=~/.kube/configs/airflowsds.yaml
kubectl config current-context
kubectl -n eagle get pods
```

If `get pods` returns a list — even an empty one — you're connected. An error
mentioning `kubernetes.docker.internal` means `KUBECONFIG` didn't take effect
and you're still on Docker Desktop. A `forbidden` means the connection works
but your RBAC doesn't cover that verb, which is worth knowing before you build
an image.

Rancher tokens are often time-limited; if this worked before and now returns
401, re-download rather than debugging it.

## 3. Secret

Everything deploys into the pre-existing **`eagle`** namespace. There is no
namespace manifest — it already exists and creating namespaces is likely
outside your RBAC on this cluster.

Because `eagle` is shared with other workloads, the resource names here
(`hysds-ui`, `opensearch-credentials`) could collide with something already in
it. Check before applying:

```sh
kubectl -n eagle get deploy,svc,ingress,secret | grep -iE 'hysds|opensearch' || echo "no collisions"
```

If anything comes back, rename — `hysds-ui-tosca` and
`hysds-ui-opensearch-credentials` would be safer in a shared namespace. The
Secret name appears in `20-deployment.yaml` (`secretRef`) and
`05-connectivity-check-job.yaml`, so change it in both.

```sh
# Leading space keeps it out of shell history when HISTCONTROL=ignorespace
 kubectl -n eagle create secret generic opensearch-credentials \
    --from-literal=OS_HOST='vpc-eaglevswir-proto-ylwe6yiuzvfjv5voxzmk57vxfy.us-west-2.es.amazonaws.com' \
    --from-literal=OS_USER='<user>' \
    --from-literal=OS_PASS='<password>'
```

Don't use `10-secret.example.yaml` with real values — it's a template showing
the shape. Kubernetes Secrets are base64, not encrypted, unless the cluster has
encryption-at-rest; anyone with `get secrets` here can read it. A read-only
OpenSearch FGAC user would mean the credential itself cannot modify the catalog,
which is strictly better than relying on the nginx allowlist alone.

### Cluster constraints confirmed 2026-11-12

- Context `rancher`; the user is namespace-scoped, so `kubectl cluster-info`
  and `kubectl get ingressclass` return Forbidden. That is expected, not a
  problem — but it does mean the ingress class cannot be discovered, which is
  why `40-ingress.yaml` omits `ingressClassName` and relies on the cluster
  default.
- `auth can-i create` is `yes` for deployment, service, ingress, job and secret
  in `eagle`.
- The namespace evaluates pods against **`restricted:latest`** Pod Security.
  Both pod specs comply; every container needs `seccompProfile`,
  `allowPrivilegeEscalation: false` and `capabilities: drop: [ALL]`, and the
  pod needs `runAsNonRoot`. Keep that in mind when adding any container here.
- `kubectl apply --dry-run=server` accepts all four manifests.

## 4. Precheck — do not skip

```sh
kubectl apply -f deploy/k8s/05-connectivity-check-job.yaml
kubectl -n eagle logs -f job/opensearch-connectivity-check
```

It tests DNS, TCP 443, authentication and a real `_count` separately, because
they fail independently with different fixes. Note especially that a **403 is a
domain access-policy denial, not a bad password** — on-prem traffic arrives with
a different source address than in-VPC traffic, so a policy that works from EKS
can still reject this cluster.

## 5. Deploy

```sh
# set the image ref in 20-deployment.yaml and the hostname in 40-ingress.yaml first
kubectl apply -f deploy/k8s/20-deployment.yaml
kubectl apply -f deploy/k8s/30-service.yaml
kubectl apply -f deploy/k8s/40-ingress.yaml

kubectl -n eagle rollout status deploy/hysds-ui
```

Confirm the ingress class matches your cluster — `kubectl get ingressclass`.
The manifest assumes `nginx`, which is typical on Rancher but not guaranteed.

## 6. Verify from inside, then outside

```sh
kubectl -n eagle port-forward deploy/hysds-ui 8080:8080

curl -s localhost:8080/healthz
curl -s -XPOST localhost:8080/grq_es/products,scenes/_count     # expect a count
curl -s -XDELETE localhost:8080/grq_es/products-2026-01          # expect 403 from the proxy
```

That third command is the one worth running. It confirms the allowlist is doing
its job before you expose the host.

## The read-only proxy

`deploy/nginx/default.conf.template` allows only what the UI reads:

| Endpoint | Methods | Used by |
|---|---|---|
| `/{index}/_msearch` | GET POST | reactivesearch — all facets and results |
| `/{index}/_search`, `/_search` | GET POST | direct searches |
| `/{index}/_count` | GET POST | `src/redux/actions/tosca/index.js:30` |
| `/{index}/_doc/{id}` | GET only | `src/pages/MetadataViewer` |
| `/{index}/_mapping` | GET only | debugging |

Everything else under `/grq_es/` returns 403. Verified by simulating nginx's
location-matching precedence over 25 cases: all six real UI endpoints allowed;
index deletes, `_bulk`, `_delete_by_query`, `_update_by_query`, `_settings`,
`_snapshot`, `_close`, cluster settings, document PUT/DELETE and `_doc/_update`
all denied; all SPA routes still served.

Two subtleties that are easy to get wrong:

- The catch-all is `location /grq_es/`, **not** `location ^~ /grq_es/`. With
  `^~`, nginx stops at the longest prefix match and never evaluates regex
  locations — which would 403 the entire UI.
- `merge_slashes on` is set explicitly. With `LOCAL_DEV = false`,
  `src/pages/Tosca/index.jsx:47` builds `${window.origin}/${GRQ_ES_URL}`, which
  produces a double slash (`//grq_es`). It works only because nginx normalizes
  it, so that is pinned rather than left to a default.

This restriction disables the user-tags write feature. That feature needs a GRQ
REST API this deployment doesn't have, so nothing is lost.

**There is no user authentication in front of the UI.** Anyone who can reach
the ingress can query the catalog, because the proxy supplies the credential on
their behalf. Read-only limits the damage but doesn't make it private. If this
needs to be non-public, put SSO or at minimum basic auth on the ingress.

## What has and hasn't been tested

**Image, verified by running it (2026-11-12).** Built for linux/amd64 and run
locally; the entrypoint rendered the templates, `nginx -t` passed, nginx 1.27.5
started as uid 101, and all four smoke tests behaved:

| Request | Result |
|---|---|
| `GET /healthz` | `ok` |
| `GET /` | 200, SPA served |
| `POST /grq_es/products,scenes/_count` | real count from the live domain |
| `DELETE /grq_es/products-2026-01` | **403 from the proxy** |

That last row is the allowlist proving itself against real nginx, not against a
simulation of its location-matching rules.

**Known cosmetic noise under emulation.** Running the amd64 image on an arm64
Mac logs `[emerg] io_setup() failed (38: Function not implemented)` — Linux AIO
is unavailable to the emulated binary. nginx disables file AIO and serves
normally. It should not appear on amd64 nodes; it would reappear on a sandboxed
runtime like gVisor, and is still harmless there.

**Manifests, verified statically and by server-side dry run.** All parse;
Deployment→Service→Ingress wiring and label selectors agree; `runAsUser`
matches the image's nginx uid; both pod specs satisfy the `restricted` Pod
Security Standard; envsubst substitutes our three placeholders while preserving
nginx's own `$uri` and `$proxy_add_x_forwarded_for`; the rendered
`Authorization` decodes back to the right credential; the location allowlist is
correct across 25 cases; `kubectl apply --dry-run=server` accepts all four
manifests with no warnings.

**Still not verified.** The image has not been pushed to Artifactory, so the
pull path and `imagePullSecret` are untested. Nothing has been applied to the
cluster for real. On-prem→VPC connectivity is unknown — that is what the
precheck Job in step 4 is for; the local smoke test proves nothing about it,
since it ran from a laptop with its own route to AWS.

**Unrelated known issue:** the map does not render footprints. Diagnosis was
interrupted by this deployment work. Facet search, the results table and the
metadata view are expected to work.
