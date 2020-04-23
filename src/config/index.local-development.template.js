// GRQ's ES url
exports.GRQ_ES_URL = "http://localhost:9200";
exports.GRQ_ES_INDICES = "grq";

// GRQ's Rest API
exports.GRQ_API_BASE = "http://localhost:8878"; // base url for GRQ API
exports.GRQ_REST_API_V1 = `${this.GRQ_API_BASE}/api/v0.1`;
exports.GRQ_REST_API_V2 = `${this.GRQ_API_BASE}/api/v0.2`;

// Mozart's ES url
exports.MOZART_ES_URL = "http://localhost:9998";
exports.MOZART_ES_INDICES = "job_status";

// Mozart's Rest API
exports.MOZART_REST_API_BASE = "http://localhost:8888";
exports.MOZART_REST_API_V1 = `${this.MOZART_REST_API_BASE}/api/v0.1`;
exports.MOZART_REST_API_V2 = `${this.MOZART_REST_API_BASE}/api/v0.2`;

// root path for app
// set to "/" if you are developing locally
exports.SOURCE_PATH = "/";
