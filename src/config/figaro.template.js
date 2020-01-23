// DEFINING THE ELASTICSEARCH CONNECTION OPTIONS
/*******************************************************************************/
// local or AWS managed ElasticSearch instance
exports.MOZART_ES_URL = "http://localhost:9998";

exports.MOZART_ES_INDICES = "job_status,task_status"; //worker_status
// exports.MOZART_ES_INDICES = "job_status-current";

exports.FILTERS = [
  {
    componentId: "tags",
    dataField: "tags.keyword",
    title: "Tags",
    type: "multi"
  },
  {
    componentId: "status",
    dataField: "status",
    title: "Status",
    type: "single"
  },
  {
    componentId: "short_error",
    dataField: "short_error.keyword",
    title: "Short Error",
    type: "single"
  },
  {
    componentId: "resource",
    dataField: "resource",
    title: "Resource",
    type: "single"
  },
  {
    componentId: "job_type",
    dataField: "job.type",
    title: "Job Type",
    type: "single"
  },
  {
    componentId: "node",
    dataField: "job.job_info.execute_node",
    title: "Node",
    type: "single"
  },
  {
    componentId: "priority",
    dataField: "job.priority",
    title: "Priority",
    type: "multi"
  },
  {
    componentId: "container_image",
    dataField: "job.container_image_name",
    title: "Container Image",
    type: "single"
  },
  {
    componentId: "instance_type",
    dataField: "job.job_info.facts.ec2_instance_type",
    title: "Instance Type",
    type: "single"
  },
  {
    componentId: "retry_count",
    dataField: "job.retry_count",
    title: "Retry Count",
    type: "single"
  }
];

exports.QUERY_LOGIC = {
  and: [
    "tags",
    "status",
    "short_error",
    "resource",
    "job_type",
    "node",
    "priority",
    "container_image",
    "instance_type",
    "retry_count",
    "query_string"
  ]
};
