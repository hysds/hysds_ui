// Configuration for the Workflows pages (/workflows and /workflows/run/:run_id).
// These are NOT generated from a template: the facets below already degrade gracefully
// when a field is missing from the workflow_status index (see utils/workflow.js).
const { MOZART_REST_API_V1 } = require("./index");

exports.WORKFLOW_ES_INDEX = "workflow_status";
exports.JOB_STATUS_INDEX = "job_status-current";
exports.WORKFLOW_REST_API = `${MOZART_REST_API_V1}/workflow`;

// Facets. A facet lists `candidates`: dataFields in order of preference. The first one that
// actually has values in the index is used, and when none does the facet is hidden (so an
// index that holds no run with, say, a failed_step shows no such facet).
exports.FILTER_CANDIDATES = [
  { componentId: "status", candidates: ["status"], title: "Status", type: "single", sortBy: "asc" },
  { componentId: "spec", candidates: ["spec_id"], title: "Workflow", type: "single", size: 1000 },
  { componentId: "version", candidates: ["spec_version"], title: "Version", type: "single", size: 1000 },
  { componentId: "on_error", candidates: ["on_error"], title: "On Error", type: "single", size: 10 },
  { componentId: "failed_step", candidates: ["failed_step"], title: "Failed At Step", type: "single", size: 1000 },
  { componentId: "error_class", candidates: ["error_class"], title: "Error Class", type: "single", size: 1000 },
  { componentId: "user", candidates: ["username"], title: "User", type: "single", size: 1000 },
  { componentId: "tags", candidates: ["tags"], title: "Tags", type: "multi", size: 1000 },
  { componentId: "created", candidates: ["created_at"], title: "Created", type: "date" },
  { componentId: "ended", candidates: ["ended_at"], title: "Ended", type: "date" },
];

// componentIds that always take part in the results query, besides the facets
exports.EXTRA_QUERY_COMPONENTS = ["query_string"];

// fields we might sort by (only those with data are offered)
exports.SORT_CANDIDATES = ["created_at", "started_at", "ended_at", "updated_at"];
exports.DEFAULT_SORT = "created_at";

exports.RESULT_FIELDS = [
  "run_id",
  "spec_id",
  "spec_version",
  "status",
  "on_error",
  "username",
  "tags",
  "created_at",
  "started_at",
  "updated_at",
  "ended_at",
  "error_class",
  "reason",
  "failed_step",
  "cancelled_by",
  "steps",
];

// run statuses in display order
exports.RUN_STATUSES = ["running", "halting", "completed", "failed", "cancelled"];

exports.AUTO_REFRESH_MS = 5000;
