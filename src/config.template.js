// configuration file

// local or AWS managed ElasticSearch instance
exports.GRQ_ES_URL = "http://localhost:9200";
// exports.GRQ_ES_URL = 'http://100.64.134.55:9200';

// comma separated indices (ex. idx1,idx2,idx3,...)
// _all so we search on all indices
// exports.GRQ_ES_INDICES = '_all';
exports.GRQ_ES_INDICES = "grq_v1.1_s1-iw_slc2,grq_v2.0.2_s1-gunw2";

// all leaflet styles: https://leaflet-extras.github.io/leaflet-providers/preview/
exports.LEAFLET_TILELAYER =
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
exports.LEAFLET_ATTRIBUTION =
  "&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors";
// exports.LEAFLET_TILELAYER = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png';
// exports.LEAFLET_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

exports.BBOX_COLOR = "#f06eaa";
exports.BBOX_WEIGHT = 5;
exports.BBOX_OPACITY = 0.3;

// ************************************************************************* //
// reactivesearch retrieves data from each component by its componentId
// custom Reactivesearch component
exports.ID_COMPONENT = "_id";

// built in Reactivesearch component id
exports.MAP_COMPONENT_ID = "polygon";
exports.QUERY_SEARCH_COMPONENT_ID = "query_string";
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
exports.GRQ_API_BASE = "http://localhost:5000"; // base url for GRQ API
// exports.GRQ_API_BASE = 'http://c-datasets.aria.hysds.io:8878/api/v0.1/';
exports.GRQ_ACTIONS_API = "user_rules/actions_config";
exports.GRQ_JOB_SPECS_ENDPOINT = "job_specs";
// exports.GRQ_ACTIONS_API = 'hysds_io/list';
exports.QUEUE_LIST_API = "user_rules/get_job_queues";

exports.QUEUE_PRIORITIES = [
  {
    value: 0,
    label: 0
  },
  {
    value: 1,
    label: 1
  },
  {
    value: 2,
    label: 2
  },
  {
    value: 3,
    label: 3
  },
  {
    value: 4,
    label: 4
  },
  {
    value: 5,
    label: 5
  },
  {
    value: 6,
    label: 6
  },
  {
    value: 7,
    label: 7
  },
  {
    value: 8,
    label: 8
  },
  {
    value: 9,
    label: 9
  }
];

exports.DEFAULT_MAP_DISPLAY = true;
exports.GRQ_TABLE_VIEW_DEFAULT = true;

exports.GRQ_DISPLAY_COLUMNS = [
  {
    Header: "_id",
    accessor: "_id"
  },
  {
    Header: "start_time",
    accessor: "starttime"
  },
  { Header: 'end_time', accessor: 'endtime', },
  // { Header: 'version', accessor: 'version', width: 100 },
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
    accessor: d => (d.metadata) ? (d.metadata.trackNumber || d.metadata.track_number) : null,
    width: 80
  },
  {
    Header: "polarisation",
    accessor: "metadata.polarisationmode"
  }
];

exports.SORT_OPTIONS = ["starttime", "endtime", "creation_timestamp"];
