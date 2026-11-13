// Configuration for the Workflows pages (/workflows and /workflows/run/:run_id).
// These are NOT generated from a template: the facets below already degrade gracefully
// when a field is missing from the workflow_status index (see utils/workflow.js).
const { MOZART_REST_API_V1 } = require("./index");

exports.WORKFLOW_ES_INDEX = "workflow_status";
exports.JOB_STATUS_INDEX = "job_status-current";
exports.WORKFLOW_REST_API = `${MOZART_REST_API_V1}/workflow`;

// Facets. A facet lists `candidates`: dataFields in order of preference. The first one that
// actually has values in the index is used, and when none does the facet is hidden. That
// is how the UI works before the backend writes spec_name / failed_node / ended_at / etc.
// and starts using them as soon as they show up.
exports.FILTER_CANDIDATES = [
  { componentId: "status", candidates: ["status"], title: "Status", type: "single", sortBy: "asc" },
  { componentId: "spec", candidates: ["spec_name", "spec_id"], title: "Spec", type: "single", size: 1000 },
  { componentId: "version", candidates: ["spec_version"], title: "Version", type: "single", size: 1000 },
  { componentId: "failed_node", candidates: ["failed_node"], title: "Failed At Step", type: "single", size: 1000 },
  { componentId: "error_class", candidates: ["error_class"], title: "Error Class", type: "single", size: 1000 },
  { componentId: "user", candidates: ["username", "user.keyword"], title: "User", type: "single", size: 1000 },
  { componentId: "tags", candidates: ["tags"], title: "Tags", type: "multi", size: 1000 },
  { componentId: "submitted", candidates: ["submitted_at"], title: "Submitted", type: "date" },
  { componentId: "ended", candidates: ["ended_at"], title: "Ended", type: "date" },
  { componentId: "has_scatter", candidates: ["has_scatter"], title: "Has Scatter", type: "boolean" },
];

// componentIds that always take part in the results query, besides the facets
exports.EXTRA_QUERY_COMPONENTS = ["query_string"];

// fields we might sort by (only those with data are offered)
exports.SORT_CANDIDATES = ["submitted_at", "updated_at", "ended_at", "duration_s"];

exports.RESULT_FIELDS = [
  "run_id",
  "spec_id",
  "spec_name",
  "spec_version",
  "status",
  "user",
  "username",
  "tags",
  "submitted_at",
  "updated_at",
  "ended_at",
  "duration_s",
  "error",
  "error_class",
  "failed_node",
  "current_nodes",
  "has_scatter",
  "nodes",
];

// run statuses in display order
exports.RUN_STATUSES = ["running", "completed", "failed", "cancelled"];

exports.AUTO_REFRESH_MS = 5000;
