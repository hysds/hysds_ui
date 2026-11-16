// Production config, copied over src/config/index.js by the Dockerfile.
//
// Everything here is compiled into dist/index_bundle.js by webpack and served
// to every browser. It must contain NO credentials and NO environment-specific
// hostnames -- see the GRQ_ES_URL note below for why that is achievable.

exports.LOCAL_DEV = false;

// Build-time only. webpack inlines these, so changing them needs a rebuild,
// not just a redeploy.
exports.VENUE = "EAGLE-VSWIR proto (on-prem)";
exports.CONFIRMATION_THRESHOLD = 1000;

// --- OpenSearch --------------------------------------------------------------
// Same-origin relative path, NOT the domain hostname. This is what keeps the
// image environment-agnostic: the browser asks its own origin for /grq_es, and
// nginx inside the pod decides where that actually goes and attaches the
// credential from a Kubernetes Secret. Pointing this at the AWS endpoint
// directly cannot work -- the credential would be in the bundle, AWS
// OpenSearch sends no CORS headers, and the VPC endpoint is not resolvable
// from a browser.
//
// With LOCAL_DEV = false, src/pages/Tosca/index.jsx:47 builds
// `${window.origin}/${GRQ_ES_URL}` -- note the resulting DOUBLE SLASH
// (https://host//grq_es). nginx normalises that away because merge_slashes is
// on by default, and deploy/nginx/default.conf.template sets it explicitly so
// the behaviour is not left to a default. The leading slash is still required
// here: src/redux/actions/tosca/index.js:30 and the MetadataViewer use
// GRQ_ES_URL as a bare relative path, and without it they would resolve
// against the current page path and break on /tosca/metadata/:index/:id.
exports.GRQ_ES_URL = "/grq_es";

// Build-time. Confirmed against the domain: the catalog is 19 monthly
// `products-YYYY-MM` indices behind the alias `products`, plus a standalone
// `scenes` index. Changing this requires an image rebuild.
exports.GRQ_ES_INDICES = "products,scenes";

// --- GRQ REST API ------------------------------------------------------------
// Not deployed. Only on-demand job submission and the user-rules editor use
// it, and both need a Mozart cluster that EAGLE-VSWIR does not have (Airflow
// handles orchestration). Blank so those calls fail fast rather than reaching
// an unintended host.
exports.GRQ_API_BASE = "";
exports.GRQ_REST_API_V1 = "";
exports.GRQ_REST_API_V2 = "";

// --- Mozart ------------------------------------------------------------------
// No Mozart. The Figaro view will be empty, by design.
exports.MOZART_BASE_URL = "";
exports.MOZART_ES_URL = "";
exports.MOZART_ES_INDICES = "job_status";
exports.MOZART_REST_API_BASE = "";
exports.MOZART_REST_API_V1 = "";
exports.MOZART_REST_API_V2 = "";

// --- Metrics -----------------------------------------------------------------
// No metrics/Kibana stack; blank hides the header links.
exports.METRICS_URL = "";
exports.KIBANA_URL = "";

exports.RABBIT_MQ_PORT = 15673;

// Served at the ingress root. If you ever serve the UI under a subpath, this
// must change AND the image must be rebuilt -- webpack.config.js reads it at
// build time for `output.publicPath`.
exports.ROOT_PATH = "/";
