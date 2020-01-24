import React from "react";
import PropTypes from "prop-types";

import { connect } from "react-redux"; // redux

import { ReactiveList } from "@appbaseio/reactivesearch"; // reactivesearch
import { editCustomFilterId } from "../../redux/actions";

import {
  FigaroDataComponent,
  FigaroDataTable
} from "../../components/FigaroDataViewer";

import {
  ToggleSlider,
  SortOptions,
  SortDirection,
  PageSizeOptions
} from "../../components/TableOptions";

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
const SORT_DIRECTION_STORE = "sort-direction-figaro";

class FigaroResultsList extends React.Component {
  constructor(props) {
    super(props);

    const pageSize = localStorage.getItem(PAGE_SIZE_STORE);
    const tableView = localStorage.getItem(TABLE_VIEW_STORE);

    this.state = {
      tableView: tableView === "true" ? true : false,
      pageSize: pageSize ? parseInt(pageSize) : 10,
      sortColumn: localStorage.getItem(SORT_FIELD_STORE) || "None",
      sortOrder: localStorage.getItem(SORT_DIRECTION_STORE) || "desc"
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

  _handleSortDirectionChange = e => {
    this.setState({ sortOrder: e.target.value });
    localStorage.setItem(SORT_DIRECTION_STORE, e.target.value);
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
          <ToggleSlider
            label="Table View: "
            value={tableView}
            onChange={this._handleTableToggle}
            checked={tableView}
          />
          <div className="results-display-buffer" />
          <SortOptions
            label="Sort By: "
            value={sortColumn}
            onChange={this._handleSortColumnChange}
            options={SORT_OPTIONS}
          />
          <SortDirection
            value={sortOrder}
            onChange={this._handleSortDirectionChange}
          />
          <PageSizeOptions
            label="Page Size: "
            value={pageSize}
            onChange={this._handlePageSizeChange}
          />
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
              ? ({ data }) =>
                  data.length > 0 ? (
                    <FigaroDataTable
                      data={data}
                      columns={FIGARO_DISPLAY_COLUMNS}
                    />
                  ) : null
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
