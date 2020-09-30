const React = require("react");

exports.FIGARO_DISPLAY_COLUMNS = [
  { Header: "status", accessor: "status" },
  { Header: "job name", accessor: "job.name" },
  { Header: "job type", accessor: "job.type" },
  { Header: "queue", accessor: "job.job_info.job_queue" },
  { Header: "node", accessor: "job.job_info.execute_node" },
  { Header: "timestamp", accessor: "@timestamp" },
  {
    id: "browse",
    width: 100,
    resizable: false,
    Cell: (state) =>
      state.original.urls ? (
        <a target="_blank" href={state.original.urls[0]}>
          Browse
        </a>
      ) : null,
  },
];

exports.FILTERS = [
  {
    componentId: "resource",
    dataField: "resource",
    title: "Resource",
    type: "single",
    defaultValue: "job",
  },
  {
    componentId: "status",
    dataField: "status",
    title: "Status",
    type: "single",
    sortBy: "asc",
  },
  {
    componentId: "tags",
    dataField: "tags.keyword",
    title: "Tags",
    type: "multi",
  },
  {
    componentId: "timestamp",
    dataField: "@timestamp",
    title: "Timestamp",
    type: "date",
  },
  {
    componentId: "short_error",
    dataField: "short_error.keyword",
    title: "Short Error",
    type: "single",
  },
  {
    componentId: "job_type",
    dataField: "job.type",
    title: "Job Type",
    type: "single",
  },
  {
    componentId: "queue",
    dataField: "job.job_info.job_queue",
    title: "Job Queue",
    type: "single",
  },
  {
    componentId: "node",
    dataField: "job.job_info.execute_node",
    title: "Node",
    type: "single",
  },
  {
    componentId: "priority",
    dataField: "job.priority",
    title: "Priority",
    type: "multi",
    sortBy: "desc",
  },
  {
    componentId: "container_image",
    dataField: "job.container_image_name",
    title: "Container Image",
    type: "single",
  },
  {
    componentId: "instance_type",
    dataField: "job.job_info.facts.ec2_instance_type",
    title: "Instance Type",
    type: "single",
  },
  {
    componentId: "retry_count",
    dataField: "job.retry_count",
    title: "Retry Count",
    type: "single",
  },
];

exports.SORT_OPTIONS = ["@timestamp"];

// TODO: TRY ADDING .KEYWORD TO COMPONENTID
exports.QUERY_LOGIC = {
  and: [
    "_id",
    "tags",
    "status",
    "short_error",
    "resource",
    "job_type",
    "queue",
    "node",
    "priority",
    "container_image",
    "instance_type",
    "retry_count",
    "query_string",
    "payload_id",
    "timestamp",
  ],
};

exports.FIELDS = [
  "_index",
  "_id",
  "status",
  "resource",
  "payload_id",
  "@timestamp",
  "short_error",
  "error",
  "traceback",
  "tags",
  "job.name",
  "job.priority",
  "job.type",
  "job.job_info.execute_node",
  "job.job_info.facts.ec2_instance_type",
  "job.job_info.job_queue",
  "job.job_info.duration",
  "job.job_info.job_url",
  "job.job_info.time_queued",
  "job.job_info.time_start",
  "job.job_info.time_end",
  "event.traceback",
  "user_tags",
  "dedup_job",
];
