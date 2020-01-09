// DEFINING THE ELASTICSEARCH CONNECTION OPTIONS
/*******************************************************************************/
// local or AWS managed ElasticSearch instance
exports.GRQ_ES_URL = "http://localhost:9200";

exports.GRQ_ES_INDICES = "grq";

// DEFINING THE OPTIONS FOR THE LEAFLET MAP
/*******************************************************************************/
exports.DISPLAY_MAP = true;
exports.DEFAULT_MAP_SHOW = false; // is map displayed by default

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
// reactivesearch retrieves data from each component by its componentId
// custom Reactivesearch component
exports.ID_COMPONENT = "_id";
exports.QUERY_SEARCH_COMPONENT_ID = "queryString";
exports.MAP_COMPONENT_ID = "polygon";

// built in Reactivesearch component id
exports.DATASET_TYPE_SEARCH_ID = "dataset_type";
exports.SATELLITE_TYPE_ID = "satellite";
exports.RESULTS_LIST_COMPONENT_ID = "results";
exports.DATASET_ID = "dataset";
exports.TRACK_NUMBER_ID = "track_number";
exports.TRACK_NUMBER_ID_OLD = "trackNumber";
exports.START_TIME_ID = "starttime";
exports.END_TIME_ID = "endtime";
exports.USER_TAGS = "user_tags";
exports.DATASET_VERSION = "version";
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
