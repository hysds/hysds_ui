import React from "react";
import PropTypes from "prop-types";

import { connect } from "react-redux"; // redux
import { retrieveData } from "../../redux/actions/index";

import { ReactiveList } from "@appbaseio/reactivesearch"; // reactivesearch
import ToggleListView from "../ToggleListView/index.jsx";
import DataTable from "../DataTable/index.jsx";

import { SORT_OPTIONS } from "../../config";
import "./style.css";

class ResultsList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pageSize: props.pageSize,
      tableView: true,
      sortColumn: "None",
      sortOrder: "desc"
    };
    this.resultsListHandler = this.resultsListHandler.bind(this);
    this.renderTable = this.renderTable.bind(this);
    this.handleTableToggle = this.handleTableToggle.bind(this);
  }

  // callback function to handle the results from ES
  resultsListHandler = res => {
    return (
      <div key={res._id}>
        <ToggleListView res={res} />
      </div>
    );
  };

  handleTableToggle() {
    this.setState({
      tableView: !this.state.tableView
    });
  }

  renderTable = ({ data, loading }) => {
    const { sortColumn, sortOrder } = this.state;
    return data.length > 0 ? (
      <DataTable data={data} sortColumn={sortColumn} sortOrder={sortOrder} />
    ) : null;
  };

  render() {
    const { componentId, queryParams } = this.props;
    const { pageSize, tableView, sortColumn, sortOrder } = this.state;

    return (
      <div>
        <div className="results-display-options">
          <div className="table-toggle-wrapper">
            <span className="table-toggle-label">Table View: </span>
            <label className="switch">
              <input
                type="checkbox"
                value={tableView}
                onChange={this.handleTableToggle.bind(this)}
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
                onChange={e =>
                  this.setState({
                    sortColumn: e.target.value
                  })
                }
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
          </div>

          <div className="results-page-select-wrapper">
            <span>Page Size: </span>
            <select
              className="page-size-dropdown"
              value={pageSize}
              onChange={e => this.setState({ pageSize: e.target.value })}
            >
              <option key="page-size-dropdown-10" value={10}>
                {10}
              </option>
              <option key="page-size-dropdown-25" value={25}>
                {25}
              </option>
              <option key="page-size-dropdown-50" value={50}>
                {50}
              </option>
              <option key="page-size-dropdown-100" value={100}>
                {100}
              </option>
            </select>
          </div>
        </div>

        <ReactiveList
          componentId={componentId}
          dataField="Dest"
          size={pageSize}
          pages={7}
          stream={true}
          pagination={true}
          scrollOnChange={false}
          paginationAt="both"
          onData={this.props.retrieveDataAction}
          react={queryParams}
          onResultStats={(total, took) =>
            `Found ${total} results in ${took} ms.`
          }
          renderItem={tableView ? null : this.resultsListHandler}
          render={tableView ? this.renderTable : null}
          sortOptions={
            sortColumn !== "None"
              ? [
                  {
                    dataField: sortColumn,
                    sortBy: sortOrder
                  }
                ]
              : null
          }
        />
      </div>
    );
  }
}

ResultsList.propTypes = {
  componentId: PropTypes.string.isRequired,
  queryParams: PropTypes.object.isRequired
};

ResultsList.defaultProps = {
  pageSize: 10
};

// Redux actions
const mapDispatchToProps = dispatch => {
  return {
    retrieveDataAction: data => dispatch(retrieveData(data))
  };
};

export default connect(
  null,
  mapDispatchToProps
)(ResultsList);
