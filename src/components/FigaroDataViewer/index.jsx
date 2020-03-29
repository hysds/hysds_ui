import React from "react";
import PropTypes from "prop-types";

import ReactTable from "react-table";

import "./style.scss";

export const FigaroDataComponent = class extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false
    };
  }

  render() {
    const { res } = this.props;

    return (
      <div key={`${res._index}-${res._id}`} className="figaro-data-component">
        {res.tags && res.tags.length > 0 ? <div>tags: {res.tags}</div> : null}
        <div>status: {res.status}</div>
        {res.resource ? <div>resource: {res.resource}</div> : null}
        <div>index: {res._index}</div>
        <div
          className="tosca-data-view-link"
          onClick={() => this.props.editCustomFilterId("_id", res._id)}
        >
          id: {res._id}
        </div>
        {res.payload_id ? (
          <div
            className="tosca-data-view-link"
            onClick={() =>
              this.props.editCustomFilterId("payload_id", res.payload_id)
            }
          >
            payload_id: {res.payload_id}
          </div>
        ) : null}
        <div>timestamp: {res["@timestamp"]}</div>
        {res.job ? <div>job: {res.job.name}</div> : null}
        {res.job && res.job.job_info ? (
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
      </div>
    );
  }
};

export const FigaroDataTable = props => {
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
          desc: sortOrder === "desc" ? true : false
        }
      ]}
    />
  );
};
