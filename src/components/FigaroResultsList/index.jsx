import React from "react";
import { connect } from "react-redux";

import { ReactiveList } from "@appbaseio/reactivesearch";
import { retrieveData, editCustomFilterId } from "../../redux/actions";

import { FigaroDataViewer } from "../../components/FigaroDataViewer";

import DataTable from "../../components/DataTable";

import {
  ToggleSlider,
  SortOptions,
  SortDirection,
  PageSizeOptions,
} from "../../components/TableOptions";

import {
  QUERY_LOGIC,
  FIGARO_DISPLAY_COLUMNS,
  FIELDS,
} from "../../config/figaro";

import "./style.css";

const TABLE_VIEW_STORE = "table-view-figaro";
const PAGE_SIZE_STORE = "page-size-figaro";
const SORT_FIELD_STORE = "sort-field-figaro";
const SORT_DIRECTION_STORE = "sort-direction-figaro";

class FigaroResultsList extends React.Component {
  constructor(props) {
    super(props);

    const pageSize = localStorage.getItem(PAGE_SIZE_STORE);
    const tableView = localStorage.getItem(TABLE_VIEW_STORE);

    this.state = {
      tableView: tableView === "true" ? true : false,
      pageSize: pageSize ? parseInt(pageSize) : 10,
      sortColumn: localStorage.getItem(SORT_FIELD_STORE) || "@timestamp",
      sortOrder: localStorage.getItem(SORT_DIRECTION_STORE) || "desc",
    };
  }

  handleTableToggle = () => {
    this.setState({ tableView: !this.state.tableView });
    localStorage.setItem(TABLE_VIEW_STORE, !this.state.tableView);
  };

  handlePageSize = (e) => {
    this.setState({ pageSize: parseInt(e.target.value) });
    localStorage.setItem(PAGE_SIZE_STORE, e.target.value);
  };

  handleSortColumn = (e) => {
    this.setState({ sortColumn: e.target.value });
    localStorage.setItem(SORT_FIELD_STORE, e.target.value);
  };

  handleSortDirection = (e) => {
    this.setState({ sortOrder: e.target.value });
    localStorage.setItem(SORT_DIRECTION_STORE, e.target.value);
  };

  handleTableSort = (sortColumn, direction) => {
    this.setState({ sortColumn, sortOrder: direction });
    localStorage.setItem(SORT_FIELD_STORE, sortColumn);
    localStorage.setItem(SORT_DIRECTION_STORE, direction);
  };

  render() {
    const { pageSize, tableView, sortColumn, sortOrder } = this.state;

    const sortOptions =
      sortColumn !== "None"
        ? [
            {
              label: sortColumn,
              dataField: sortColumn,
              sortBy: sortOrder,
            },
          ]
        : null;

    return (
      <div>
        <div className="results-display-options">
          <ToggleSlider
            label="Table View: "
            value={tableView}
            onChange={this.handleTableToggle}
            checked={tableView}
          />
          <div className="results-display-buffer" />
          <div className="sort-wrapper">
            <SortOptions
              label="Sort:"
              value={sortColumn}
              onChange={this.handleSortColumn}
              options={FIGARO_DISPLAY_COLUMNS.filter((d) => d.accessor).map(
                (d) => (d.keyword ? `${d.accessor}.keyword` : d.accessor)
              )}
            />
            <SortDirection
              value={sortOrder}
              onChange={this.handleSortDirection}
            />
            <PageSizeOptions
              label="Page Size: "
              value={pageSize}
              onChange={this.handlePageSize}
            />
          </div>
        </div>

        <ReactiveList
          componentId="figaro-results"
          dataField="figaro-reactive-list"
          className="reactivesearch-results-list"
          pagination={true}
          size={pageSize}
          pages={7}
          sortOptions={sortOptions}
          paginationAt="both"
          react={QUERY_LOGIC}
          onData={this.props.retrieveData}
          renderItem={
            tableView
              ? null
              : (res) => (
                  <div key={`${res._index}-${res._id}`}>
                    <FigaroDataViewer
                      res={res}
                      editCustomFilterId={this.props.editCustomFilterId}
                    />
                  </div>
                )
          }
          render={
            tableView
              ? ({ data }) =>
                  data.length > 0 ? (
                    <DataTable
                      data={data}
                      columns={FIGARO_DISPLAY_COLUMNS}
                      sortColumn={this.state.sortColumn}
                      sortOrder={this.state.sortOrder}
                      sortHandler={this.handleTableSort}
                    />
                  ) : null
              : null
          }
          renderResultStats={(stats) => (
            <h3 className="figaro-result-stats">{`${stats.numberOfResults} results`}</h3>
          )}
          includeFields={FIELDS ? FIELDS : null}
          onError={(e) => {
            if (e.responses) alert(JSON.stringify(e.responses));
          }}
        />
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  retrieveData: (data) => dispatch(retrieveData(data)),
  editCustomFilterId: (componentId, value) =>
    dispatch(editCustomFilterId(componentId, value)),
});

export default connect(null, mapDispatchToProps)(FigaroResultsList);
