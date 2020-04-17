import React from "react";
import PropTypes from "prop-types";

import { connect } from "react-redux"; // redux
import { retrieveData } from "../../redux/actions";

import { ReactiveList } from "@appbaseio/reactivesearch"; // reactivesearch
import ToscaDataViewer from "../ToscaDataViewer";
import DataTable from "../DataTable";

import {
  ToggleSlider,
  SortOptions,
  SortDirection,
  PageSizeOptions,
} from "../../components/TableOptions";
import { SORT_OPTIONS, FIELDS } from "../../config/tosca";
import "./style.scss";

const TABLE_VIEW_STORE = "table-view-tosca";
const PAGE_SIZE_STORE = "page-size-tosca";
const SORT_FIELD_STORE = "sort-field-tosca";
const SORT_DIRECTION_STORE = "sort-direction-tosca";

class ResultsList extends React.Component {
  constructor(props) {
    super(props);

    const pageSize = localStorage.getItem(PAGE_SIZE_STORE);
    const tableView = localStorage.getItem(TABLE_VIEW_STORE);

    this.state = {
      tableView: tableView === "true" ? true : false,
      pageSize: pageSize ? parseInt(pageSize) : props.pageSize,
      sortColumn: localStorage.getItem(SORT_FIELD_STORE) || "None",
      sortOrder: localStorage.getItem(SORT_DIRECTION_STORE) || "desc",
    };
  }

  // callback function to handle the results from ES
  resultsListHandler = (res) => (
    <div key={`${res._index}-${res._id}`}>
      <ToscaDataViewer res={res} />
    </div>
  );

  _handleTableToggle = () => {
    this.setState({ tableView: !this.state.tableView });
    localStorage.setItem(TABLE_VIEW_STORE, !this.state.tableView);
  };

  _handlePageSizeChange = (e) => {
    this.setState({ pageSize: parseInt(e.target.value) });
    localStorage.setItem(PAGE_SIZE_STORE, e.target.value);
  };

  _handleSortColumnChange = (e) => {
    this.setState({ sortColumn: e.target.value });
    localStorage.setItem(SORT_FIELD_STORE, e.target.value);
  };

  _handleSortDirectionChange = (e) => {
    this.setState({ sortOrder: e.target.value });
    localStorage.setItem(SORT_DIRECTION_STORE, e.target.value);
  };

  renderTable = ({ data, loading }) => {
    const { sortColumn, sortOrder } = this.state;

    return data.length > 0 ? (
      <DataTable
        data={data}
        sortColumn={sortColumn}
        sortOrder={sortOrder}
        theme={this.props.theme}
      />
    ) : null;
  };

  render() {
    const { componentId, queryParams } = this.props;
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
          componentId={componentId}
          className="reactivesearch-results-list"
          dataField="tosca_reactive_list"
          size={pageSize}
          pages={7}
          stream={true}
          pagination={true}
          scrollOnChange={false}
          paginationAt="both"
          onData={this.props.retrieveData}
          react={queryParams}
          onResultStats={(total, took) =>
            `Found ${total} results in ${took} ms.`
          }
          renderItem={(res) => <div key={res._id}>{res._id}</div>}
          renderItem={tableView ? null : this.resultsListHandler}
          render={tableView ? this.renderTable : null}
          sortOptions={sortOptions}
          includeFields={FIELDS ? FIELDS : null}
        />
      </div>
    );
  }
}

ResultsList.propTypes = {
  componentId: PropTypes.string.isRequired,
  queryParams: PropTypes.object.isRequired,
};

ResultsList.defaultProps = {
  pageSize: 10,
};

// Redux actions
const mapDispatchToProps = (dispatch) => ({
  retrieveData: (data) => dispatch(retrieveData(data)),
});

export default connect(null, mapDispatchToProps)(ResultsList);
