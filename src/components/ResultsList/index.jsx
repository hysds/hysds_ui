import React from 'react';
import PropTypes from 'prop-types';
import { ReactiveList } from '@appbaseio/reactivesearch';
import ToggleListView from '../ToggleListView/index.jsx';
import Select from 'react-select'
import DataTable from '../DataTable/index.jsx';

import { TOSCA_TABLE_VIEW_DEFAULT } from '../../config';
import './style.css';

/**
 * Display results from ES (TOSCA)
 *  TODO:
 *    Make compatible with GRQ data
 *    Make it expandable to show more info (ToggleListView component)
 */
class ResultsList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pageSize: props.pageSize,
      tableView: true,
      sortColumn: null,
      sortOrder: 'asc'
    };
    this.resultsListHandler = this.resultsListHandler.bind(this);
    this.renderTable = this.renderTable.bind(this);
    this.handleTableToggle = this.handleTableToggle.bind(this);
    this.handleSorting = this.handleSorting.bind(this);
  }

  resultsListHandler = res => { // callback function to handle the results from ES
    return (
      <div key={res._id}>
        <ToggleListView res={res} />
      </div>
    );
  }

  handleSorting(event, v) {
    const sortInfo = event[0];
    this.setState({
      sortColumn: sortInfo.id,
      sortOrder: sortInfo.desc ? 'desc' : 'asc'
    });
  }

  handleTableToggle(e) {
    this.setState({
      tableView: !this.state.tableView
    });
  }

  renderTable = ({ data, loading }) => (
    data.length > 0 ? <DataTable data={data} handleSorting={this.handleSorting} /> : null
  );


  render() {
    const { componentId, queryParams } = this.props;
    const { pageSize, tableView, sortColumn, sortOrder } = this.state;

    const pageSizeOptions = [
      { value: 10, label: 10 },
      { value: 25, label: 25 },
      { value: 50, label: 50 },
      { value: 100, label: 100 },
    ];

    return (
      <div>
        <div className='results-display-options'>
          <span>Table View: </span>
          <label className="switch">
            <input type="checkbox" value={tableView} onChange={this.handleTableToggle.bind(this)} checked={tableView} />
            <span className="slider round"></span>
          </label>
          <div className='results-page-select-wrapper'>
            <span>Page Size:</span>
            <Select
              label='Page Size: '
              name='page-size'
              options={pageSizeOptions}
              value={{ value: pageSize, label: pageSize }}
              defaultValue={{ value: pageSize, label: pageSize }}
              onChange={(e) => this.setState({ pageSize: e.value })}
            />
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
          onData={this.props.retrieveData}
          react={queryParams}
          onResultStats={(total, took) => `Found ${total} results in ${took} ms.`}
          renderItem={tableView ? null : this.resultsListHandler}
          render={tableView ? this.renderTable : null}
          sortOptions={sortColumn ? [{
            dataField: sortColumn,
            sortBy: sortOrder
          }] : null}
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

export default ResultsList;
