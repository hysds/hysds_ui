// GRQ's ES url
exports.GRQ_ES_URL = "https://{{ MOZART_PVT_IP }}/grq_es";
exports.GRQ_ES_INDICES = "grq";

// GRQ's Rest API
exports.GRQ_API_BASE = "https://{{ MOZART_PVT_IP }}/grq";
exports.GRQ_REST_API_V1 = `${this.GRQ_API_BASE}/api/v0.1`;
exports.GRQ_REST_API_V2 = `${this.GRQ_API_BASE}/api/v0.2`;

// used to view verdi job worker logs
exports.MOZART_BASE_URL = "https://{{ MOZART_PVT_IP }}";

// Mozart's ES url
exports.MOZART_ES_URL = "https://{{ MOZART_PVT_IP }}/mozart_es";
exports.MOZART_ES_INDICES = "job_status";

// Mozart's Rest API
exports.MOZART_REST_API_BASE = "https://{{ MOZART_PVT_IP }}/mozart";
exports.MOZART_REST_API_V1 = `${this.MOZART_REST_API_BASE}/api/v0.1`;
exports.MOZART_REST_API_V2 = `${this.MOZART_REST_API_BASE}/api/v0.2`;

// root path for app
// set to "/" if you are developing locally
exports.ROOT_PATH = "/hysds_ui/";
