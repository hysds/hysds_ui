// DEFINING THE ELASTICSEARCH CONNECTION OPTIONS
/*******************************************************************************/
// local or AWS managed ElasticSearch instance
// exports.GRQ_ES_URL = "http://localhost:9200";
exports.GRQ_ES_URL = "http://localhost:9999";

exports.GRQ_ES_INDICES = "grq";

// DEFINING THE OPTIONS FOR THE LEAFLET MAP
/*******************************************************************************/
exports.DISPLAY_MAP = true;
// all leaflet styles: https://leaflet-extras.github.io/leaflet-providers/preview/
exports.LEAFLET_TILELAYER =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png";
exports.LEAFLET_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

exports.BBOX_COLOR = "#f06eaa";
exports.BBOX_WEIGHT = 5;
exports.BBOX_OPACITY = 0.3;
/*******************************************************************************/

// ************************************************************************* //
// // custom Reactivesearch component
ID_COMPONENT = "_id";
QUERY_SEARCH_COMPONENT_ID = "queryString";
MAP_COMPONENT_ID = "polygon";

// built in Reactivesearch component id
DATASET_ID = "dataset";
DATASET_TYPE_SEARCH_ID = "dataset_type";
SATELLITE_TYPE_ID = "satellite";
RESULTS_LIST_COMPONENT_ID = "results";
TRACK_NUMBER_ID = "track_number";
TRACK_NUMBER_ID_OLD = "trackNumber";
START_TIME_ID = "starttime";
END_TIME_ID = "endtime";
USER_TAGS = "user_tags";
DATASET_VERSION = "version";

// ************************************************************************* //
// reactivesearch retrieves data from each component by its componentId
// custom Reactivesearch component
exports.ID_COMPONENT = ID_COMPONENT;
exports.QUERY_SEARCH_COMPONENT_ID = QUERY_SEARCH_COMPONENT_ID;
exports.MAP_COMPONENT_ID = MAP_COMPONENT_ID;

// built in Reactivesearch component id
exports.DATASET_TYPE_SEARCH_ID = DATASET_TYPE_SEARCH_ID;
exports.SATELLITE_TYPE_ID = SATELLITE_TYPE_ID;
exports.RESULTS_LIST_COMPONENT_ID = RESULTS_LIST_COMPONENT_ID;
exports.DATASET_ID = DATASET_ID;
exports.TRACK_NUMBER_ID = TRACK_NUMBER_ID;
exports.TRACK_NUMBER_ID_OLD = TRACK_NUMBER_ID_OLD;
exports.START_TIME_ID = START_TIME_ID;
exports.END_TIME_ID = END_TIME_ID;
exports.USER_TAGS = USER_TAGS;
exports.DATASET_VERSION = DATASET_VERSION;
// ************************************************************************* //

// fields returned by Elasticsearch (less fields = faster UI)
exports.FIELDS = [
  "starttime",
  "endtime",
  "location",
  "center",
  "urls",
  "datasets",
  "metadata.track_number",
  "metadata.trackNumber",
  "metadata.status",
  "metadata.platform",
  "metadata.sensoroperationalmode",
  "metadata.polarisationmode"
];

// API endpoints to get the available actions for on-demand
exports.GRQ_API_BASE = "http://localhost:8878"; // base url for GRQ API
exports.GRQ_REST_API_V1 = `${this.GRQ_API_BASE}/api/v0.1`;
exports.GRQ_REST_API_V2 = `${this.GRQ_API_BASE}/api/v0.2`;
exports.GRQ_ACTIONS_API = "user_rules/actions_config";
exports.GRQ_JOB_SPECS_ENDPOINT = "job_specs";
// exports.GRQ_ACTIONS_API = 'hysds_io/list';

exports.MOZART_REST_API_BASE = "http://localhost:8888";
exports.MOZART_REST_API_V1 = `${this.MOZART_REST_API_BASE}/api/v0.1`;
exports.MOZART_REST_API_V2 = `${this.MOZART_REST_API_BASE}/api/v0.2`;

exports.QUEUE_LIST_API = "user_rules/get_job_queues";

exports.GRQ_TABLE_VIEW_DEFAULT = true;

exports.GRQ_DISPLAY_COLUMNS = [
  {
    Header: "_id",
    accessor: "_id",
    width: 350
  },
  {
    Header: "start_time",
    accessor: "starttime"
  },
  { Header: "end_time", accessor: "endtime" },
  {
    Header: "status",
    accessor: "metadata.status"
  },
  {
    Header: "platform",
    accessor: "metadata.platform",
    width: 150
  },
  {
    Header: "direction",
    accessor: "metadata.direction",
    width: 100
  },
  {
    Header: "mode",
    accessor: "metadata.sensoroperationalmode"
  },
  {
    id: "trackNumber",
    Header: "track",
    accessor: d =>
      d.metadata ? d.metadata.trackNumber || d.metadata.track_number : null,
    width: 50
  },
  {
    Header: "polarisation",
    accessor: "metadata.polarisationmode"
  }
];

exports.SORT_OPTIONS = ["starttime", "endtime", "creation_timestamp"];
