import React from "react";
import PropTypes from "prop-types";

import { connect } from "react-redux"; // redux
import { retrieveData } from "../../redux/actions";

import { ReactiveList } from "@appbaseio/reactivesearch"; // reactivesearch
import ToscaDataViewer from "../ToscaDataViewer";
import DataTable from "../DataTable";

import { SORT_OPTIONS } from "../../config";
import "./style.scss";

class ResultsList extends React.Component {
  constructor(props) {
    super(props);

    const pageSize = localStorage.getItem("page-size");

    this.state = {
      pageSize: pageSize ? parseInt(pageSize) : props.pageSize,
      tableView: localStorage.getItem("table-view") === "true" ? true : false,
      sortColumn: "None",
      sortOrder: "desc"
    };
  }

  // callback function to handle the results from ES
  resultsListHandler = res => (
    <div key={`${res._index}-${res._id}`}>
      <ToscaDataViewer res={res} />
    </div>
  );

  _handleTableToggle = () => {
    localStorage.setItem("table-view", !this.state.tableView);
    this.setState({ tableView: !this.state.tableView });
  };

  _handlePageSizeChange = e => {
    this.setState({ pageSize: parseInt(e.target.value) });
    localStorage.setItem("page-size", e.target.value);
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
                onChange={this._handleTableToggle.bind(this)}
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

        <ReactiveList
          componentId={componentId}
          className="reactivesearch-results-list"
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
          sortOptions={sortOptions}
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

export default connect(null, mapDispatchToProps)(ResultsList);
