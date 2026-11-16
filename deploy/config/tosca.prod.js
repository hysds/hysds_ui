// Tosca view config baked into the image by the Dockerfile.
//
// This is the version-controlled source of truth. src/config/tosca.js is in
// .gitignore (upstream expects it to be generated per-deployment), so keeping
// the EAGLE-VSWIR facet configuration only there would mean it is absent from
// a fresh clone and the image could not be built.
//
// For local development: cp deploy/config/tosca.prod.js src/config/tosca.js

// Tosca view config for the EAGLE-VSWIR prototype catalog.
//
// Written 2026-11-09 from the live mappings of `products` (19 monthly indices,
// ~42.0M docs) and `scenes` (1 index, ~1.65M docs). This replaces the generic
// HySDS template, essentially none of whose fields exist here -- there is no
// `dataset`, `dataset_type`, `dataset_level`, `system_version`, `continent`,
// `creation_timestamp`, `metadata.*`, `urls`, `browse_urls` or `id`.
//
// GRQ_ES_INDICES spans both names, so three rules shaped what follows:
//
//  1. AVOID the five paths that exist in BOTH indices with INCOMPATIBLE types --
//     properties.cloud_fraction, properties.nodata_fraction,
//     properties.num_valid_lines, properties.solar_azimuth and
//     properties.solar_zenith are floats/integers in `products` but objects
//     ({value, source}) in `scenes`. Aggregating or sorting on those across
//     both indices is a mapping conflict. They are safe to *return*, not to
//     facet or sort on.
//  2. A field present in only one index is fine -- a terms agg over an unmapped
//     field just yields no buckets for the other's documents.
//  3. SidebarFilters only implements single / multi / date / boolean
//     (src/components/SidebarFilters/index.jsx:37) -- there is no range slider,
//     so the numeric fields are table columns rather than facets.

// NOTE: the template had `const React = require("react")` here because its
// `Cell` renderers returned JSX. The only custom Cell below returns a plain
// string, so that import is gone -- which also keeps this file requireable by
// plain node for validation. Put it back if you add a JSX Cell.

// Name of the geo_shape field used by the map's bbox filter and the per-result
// "Query Region" button. Upstream hardcoded "location" in ReactiveMap and
// ToscaDataViewer; both now read this instead. The EAGLE-VSWIR indices call it
// `footprint`.
exports.GEO_FIELD = "footprint";

// Field the results list sorts by before the user picks one. Upstream
// hardcoded "@timestamp", which does not exist in these indices -- OpenSearch
// errors on sorting an unmapped field, so the list failed on first load.
// Must be a sortable (non-object, non-geo) field present in every index.
exports.DEFAULT_SORT_FIELD = "start_time";

// Field shown as "last modified" on each result card. Upstream hardcoded
// "@timestamp", which these indices do not have, so the line never rendered.
exports.LAST_MODIFIED_FIELD = "modified";

exports.DISPLAY_MAP = true;

exports.LEAFLET_TILELAYER = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
exports.LEAFLET_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

exports.BBOX_COLOR = "#f06eaa";
exports.BBOX_WEIGHT = 5;
exports.BBOX_OPACITY = 0.3;

exports.ID_COMPONENT = "_id";
exports.QUERY_SEARCH_COMPONENT_ID = "query_string";
exports.MAP_COMPONENT_ID = "polygon";
exports.RESULTS_LIST_COMPONENT_ID = "results";

// _source fields returned per hit. Fewer fields = faster UI. The conflicting
// properties.* paths are included deliberately: returning them is harmless, it
// is only aggregating/sorting on them that breaks.
exports.FIELDS = [
  // shared
  "scene_id",
  "created",
  "modified",
  "start_time",
  "stop_time",
  "footprint",
  // products
  "product_id",
  "product",
  "level",
  "version",
  "crid",
  "environment",
  "is_latest",
  "daac.status",
  "pge_name",
  "pge_version",
  "produced_by",
  "bands",
  "total_size_bytes",
  "files",
  // scenes
  "dcid",
  "daynight",
  "instrument_mode",
  "submode",
  "orbit",
  "scene",
];

exports.GRQ_TABLE_VIEW_DEFAULT = true;

// NOTE: every componentId here must also appear in QUERY_LOGIC below.
// `size` is the number of facet buckets fetched, so keep it near the real
// cardinality -- 1000 on a high-cardinality field is a slow aggregation.
exports.FILTERS = [
  // --- products ------------------------------------------------------------
  {
    componentId: "product",
    dataField: "product", // already keyword; no .keyword suffix
    title: "Product",
    type: "single",
    size: 200,
  },
  {
    componentId: "level",
    dataField: "level",
    title: "Level",
    type: "single",
    size: 50,
  },
  {
    componentId: "version",
    dataField: "version",
    title: "Version",
    type: "single",
    size: 100,
  },
  {
    componentId: "is_latest",
    dataField: "is_latest",
    title: "Latest Only",
    type: "boolean",
  },
  {
    componentId: "daac_status",
    dataField: "daac.status",
    title: "DAAC Status",
    type: "single",
    size: 20,
  },
  {
    componentId: "environment",
    dataField: "environment",
    title: "Environment",
    type: "single",
    size: 20,
  },
  {
    componentId: "crid",
    dataField: "crid",
    title: "CRID",
    type: "single",
    size: 100,
  },
  {
    componentId: "pge_name",
    dataField: "pge_name",
    title: "PGE Name",
    type: "single",
    size: 100,
  },
  {
    componentId: "pge_version",
    dataField: "pge_version",
    title: "PGE Version",
    type: "single",
    size: 100,
  },
  {
    componentId: "produced_by",
    dataField: "produced_by",
    title: "Produced By",
    type: "single",
    size: 50,
  },

  // --- scenes --------------------------------------------------------------
  {
    componentId: "daynight",
    dataField: "daynight",
    title: "Day / Night",
    type: "single",
    size: 10,
  },
  {
    componentId: "instrument_mode",
    dataField: "instrument_mode",
    title: "Instrument Mode",
    type: "single",
    size: 50,
  },
  {
    componentId: "submode",
    dataField: "submode",
    title: "Submode",
    type: "single",
    size: 50,
  },

  // --- shared dates --------------------------------------------------------
  {
    componentId: "start_time",
    dataField: "start_time",
    title: "Start Time",
    type: "date",
  },
  {
    componentId: "stop_time",
    dataField: "stop_time",
    title: "Stop Time",
    type: "date",
  },
  {
    componentId: "created",
    dataField: "created",
    title: "Created",
    type: "date",
  },
  {
    componentId: "modified",
    dataField: "modified",
    title: "Modified",
    type: "date",
  },
];

exports.QUERY_LOGIC = {
  and: [
    "product",
    "level",
    "version",
    "is_latest",
    "daac_status",
    "environment",
    "crid",
    "pge_name",
    "pge_version",
    "produced_by",
    "daynight",
    "instrument_mode",
    "submode",
    "start_time",
    "stop_time",
    "created",
    "modified",
    this.ID_COMPONENT,
    this.MAP_COMPONENT_ID,
    this.QUERY_SEARCH_COMPONENT_ID,
  ],
};

// `keyword: true` makes DataTable sort on `<field>.keyword`
// (src/components/DataTable/index.jsx:21). These fields are ALREADY of type
// keyword with no subfield, so that flag is deliberately omitted everywhere --
// setting it would sort on a field that does not exist.
exports.GRQ_DISPLAY_COLUMNS = [
  { Header: "Product ID", accessor: "product_id", width: 320 },
  { Header: "Scene ID", accessor: "scene_id", width: 220 },
  { Header: "Product", accessor: "product", width: 160 },
  { Header: "Level", accessor: "level", width: 90 },
  { Header: "Version", accessor: "version", width: 100 },
  { Header: "Start", accessor: "start_time", width: 200 },
  { Header: "Stop", accessor: "stop_time", width: 200 },
  { Header: "Created", accessor: "created", width: 200 },
  { Header: "Latest", accessor: "is_latest", width: 80 },
  {
    Header: "Size",
    accessor: "total_size_bytes",
    width: 110,
    Cell: (state) => {
      const b = state.original.total_size_bytes;
      if (b === undefined || b === null) return null;
      const units = ["B", "KB", "MB", "GB", "TB"];
      let i = 0;
      let n = b;
      while (n >= 1024 && i < units.length - 1) {
        n /= 1024;
        i += 1;
      }
      return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
    },
  },
];
