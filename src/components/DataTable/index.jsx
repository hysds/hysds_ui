import React from "react";
import PropTypes from "prop-types";
import ReactTable from "react-table";

import { GRQ_DISPLAY_COLUMNS } from "../../config.js";

import "react-table/react-table.css";
import "./style.css";

export default class DataTable extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { data } = this.props;
    return (
      <ReactTable
        manual
        data={data}
        columns={GRQ_DISPLAY_COLUMNS}
        showPagination={false}
        showPageSizeOptions={false}
        pageSize={data.length}
        sortable={false}
        defaultSorted={[
          {
            id: this.props.sortColumn,
            desc: this.props.sortOrder === "desc" ? true : false
          }
        ]}
      />
    );
  }
}

DataTable.propTypes = {
  data: PropTypes.array.isRequired
};
