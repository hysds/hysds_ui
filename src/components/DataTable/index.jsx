import React from 'react';
import PropTypes from 'prop-types';
import ReactTable from "react-table";

import "react-table/react-table.css";
import './style.css';


const columnData = [
  { Header: '_id', accessor: '_id' },
  { Header: 'dataset', accessor: 'dataset', width: 250 },
  { Header: 'version', accessor: 'version', width: 100 },
  { Header: 'track', accessor: 'metadata.trackNumber', width: 100 },
  { Header: "start_time", accessor: "starttime" },
  { Header: 'product_creation_date', accessor: 'metadata.processingStop', },
  { Header: 'dataset_level', accessor: 'dataset_level' },
];

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
        columns={columnData}
        showPagination={false}
        pageSize={data.length}
        onSortedChange={this.props.handleSorting}
      />
    );
  }
}
