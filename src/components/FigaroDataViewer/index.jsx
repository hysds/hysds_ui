import React from "react";
import PropTypes from "prop-types";

import ReactTable from "react-table";
import UserTags from "../UserTags";

import { MOZART_REST_API_V1 } from "../../config";

import "./style.scss";

export const FigaroDataViewer = (props) => {
  const { res } = props;
  const endpoint = `${MOZART_REST_API_V1}/user-tags`;

  let userTags = res.user_tags || [];

  var userTagsJobStatus = [
    "job-queued",
    "job-started",
    "job-completed",
    "job-failed",
  ];
  const userTagsComponent =
    res._index.startsWith("job_status-") &&
    userTagsJobStatus.includes(res.status) ? (
      <UserTags
        tags={userTags}
        endpoint={endpoint}
        index={res._index}
        id={res._id}
      />
    ) : null;

  return (
    <div key={`${res._index}-${res._id}`} className="figaro-data-component">
      {res.tags && res.tags.length > 0 ? <div>tags: {res.tags}</div> : null}
      <div>status: {res.status}</div>
      {res.resource ? <div>resource: {res.resource}</div> : null}
      <div>index: {res._index}</div>
      {res.payload_id ? (
        <div
          className="tosca-data-view-link"
          onClick={() => props.editCustomFilterId("payload_id", res.payload_id)}
        >
          payload_id: {res.payload_id}
        </div>
      ) : null}
      <div>timestamp: {res["@timestamp"]}</div>
      {res.job ? <div>job: {res.job.name}</div> : null}
      {res.job && res.job.job_info && res.job.job_info.execute_node ? (
        <div>node: {res.job.job_info.execute_node}</div>
      ) : null}
      {res.job && res.job.job_info ? (
        <div>queue: {res.job.job_info.job_queue}</div>
      ) : null}
      {res.job ? <div>priority: {res.job.priority}</div> : null}
      {res.job && res.job.job_info && res.job.job_info.duration ? (
        <div>duration: {res.job.job_info.duration}s</div>
      ) : null}
      {res.traceback ? (
        <div className="figaro-traceback">{res.traceback}</div>
      ) : null}
      {res.event && res.event.traceback ? (
        <div className="figaro-traceback">{res.event.traceback}</div>
      ) : null}
      {userTagsComponent}
      {res.job && res.job.job_info && res.job.job_info.job_url ? (
        <div>
          <a href={res.job.job_info.job_url} target="_none">
            View Job
          </a>
        </div>
      ) : null}
    </div>
  );
};

FigaroDataViewer.propTypes = {
  res: PropTypes.object.isRequired,
};

export const FigaroDataTable = (props) => {
  const { columns, data, sortColumn, sortOrder } = props;

  return (
    <ReactTable
      manual
      data={data}
      columns={columns}
      showPagination={false}
      showPageSizeOptions={false}
      pageSize={data.length}
      sortable={false}
      defaultSorted={[
        {
          id: sortColumn,
          desc: sortOrder === "desc" ? true : false,
        },
      ]}
    />
  );
};
