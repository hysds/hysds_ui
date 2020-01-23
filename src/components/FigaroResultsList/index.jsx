import React from "react";
import PropTypes from "prop-types";

import { connect } from "react-redux"; // redux

import { ReactiveList } from "@appbaseio/reactivesearch"; // reactivesearch
import DataTable from "../DataTable";

import { editCustomFilterId } from "../../redux/actions";

import {
  FigaroDataComponent,
  FigaroDataTable
} from "../../components/FigaroDataViewer";

// import { SORT_OPTIONS } from "../../config/tosca";
import {
  QUERY_LOGIC,
  FIGARO_DISPLAY_COLUMNS,
  SORT_OPTIONS
} from "../../config/figaro";

import "./style.scss";

const TABLE_VIEW_STORE = "table-view-figaro";
const PAGE_SIZE_STORE = "page-size-figaro";
const SORT_FIELD_STORE = "sort-field-figaro";

class FigaroResultsList extends React.Component {
  constructor(props) {
    super(props);
    const pageSize = localStorage.getItem(PAGE_SIZE_STORE);

    this.state = {
      sortColumn: localStorage.getItem(SORT_FIELD_STORE) || "None",
      tableView:
        localStorage.getItem(TABLE_VIEW_STORE) === "true" ? true : false,
      pageSize: pageSize ? parseInt(pageSize) : 10,
      sortOrder: "desc"
    };
  }

  _handleTableToggle = () => {
    localStorage.setItem(TABLE_VIEW_STORE, !this.state.tableView);
    this.setState({ tableView: !this.state.tableView });
  };

  _handlePageSizeChange = e => {
    this.setState({ pageSize: parseInt(e.target.value) });
    localStorage.setItem(PAGE_SIZE_STORE, e.target.value);
  };

  _handleSortColumnChange = e => {
    this.setState({ sortColumn: e.target.value });
    localStorage.setItem(SORT_FIELD_STORE, e.target.value);
  };

  render() {
    const { pageSize, tableView, sortColumn, sortOrder } = this.state;

    const sortOptions =
      sortColumn !== "None"
        ? [
            {
              dataField: sortColumn,
              sortBy: sortOrder
            }
          ]
        : null;

    return (
      <div>
        <div className="results-display-options">
          <div className="table-toggle-wrapper">
            <span className="table-toggle-label">Table View: </span>
            <label className="switch">
              <input
                type="checkbox"
                value={tableView}
                onChange={this._handleTableToggle}
                checked={tableView}
              />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="sort-results-wrapper">
            <div className="sort-results-select-wrapper">
              <span>Sort By: </span>
              <select
                className="sort-column-dropdown"
                value={sortColumn}
                onChange={this._handleSortColumnChange}
              >
                <option value="None">None</option>
                {SORT_OPTIONS.map(field => (
                  <option key={`sort-column-${field}`} value={field}>
                    {field}
                  </option>
                ))}
              </select>
            </div>

            <div className="sort-direction-select-wrapper">
              <select
                className="sort-order-dropdown"
                value={sortOrder}
                onChange={e => this.setState({ sortOrder: e.target.value })}
              >
                <option key="sort-direction-desc" value="desc">
                  desc
                </option>
                <option key="sort-direction-asc" value="asc">
                  asc
                </option>
              </select>
            </div>

            <div className="results-page-select-wrapper">
              <span>Page Size: </span>
              <select
                className="page-size-dropdown"
                value={pageSize}
                onChange={this._handlePageSizeChange}
              >
                {[10, 25, 50, 100].map(x => (
                  <option key={`page-size-dropdown-${x}`} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <ReactiveList
          componentId="figaro-results"
          dataField="figaro-reactive-list"
          pagination={true}
          size={pageSize}
          pages={7}
          sortOptions={sortOptions}
          paginationAt="both"
          react={QUERY_LOGIC}
          renderItem={
            tableView
              ? null
              : res => (
                  <div key={`${res._index}-${res._id}`}>
                    <FigaroDataComponent
                      res={res}
                      editCustomFilterId={this.props.editCustomFilterId}
                    />
                  </div>
                )
          }
          render={
            tableView
              ? ({ data }) => (
                  <FigaroDataTable
                    data={data}
                    columns={FIGARO_DISPLAY_COLUMNS}
                  />
                )
              : null
          }
        />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  // darkMode: state.themeReducer.darkMode
});

const mapDispatchToProps = dispatch => ({
  editCustomFilterId: (componentId, value) =>
    dispatch(editCustomFilterId(componentId, value))
});

export default connect(mapStateToProps, mapDispatchToProps)(FigaroResultsList);
