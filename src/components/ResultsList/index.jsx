import React from 'react';
import PropTypes from 'prop-types';
import { ReactiveList } from '@appbaseio/reactivesearch';
import ToggleListView from '../ToggleListView/index.jsx';
import Select from 'react-select'

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
      tableView: true
    };
    this.resultsListHandler = this.resultsListHandler.bind(this);
    this.renderTable = this.renderTable.bind(this);
    this.handleTableToggle = this.handleTableToggle.bind(this);
  }

  resultsListHandler = res => { // callback function to handle the results from ES
    return (
      <div key={res._id}>
        <ToggleListView res={res} />
      </div>
    );
  }

  handleTableToggle(e) {
    this.setState({
      tableView: !this.state.tableView
    });
  }

  renderTable = ({ data }) => (
    <table className='custom-table-wrapper'>
      <tbody>
        <tr>
          <th className='custom-table-cell'>_id</th>
          <th className='custom-table-cell'>dataset</th>
          <th className='custom-table-cell'>dataset_type</th>
        </tr>
        {data.map(item => (
          <tr key={`${item._index}/${item._id}`}>
            <td className='custom-table-cell'>{item._id}</td>
            <td className='custom-table-cell'>{item.dataset}</td>
            <td className='custom-table-cell'>{item.dataset_type}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  render() {
    const { componentId, queryParams } = this.props;
    const { pageSize, tableView } = this.state;

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
              // defaultInputValue={pageSize.toString()}
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
          // loader='Loading Results..'
          // onNoResults={}
          onError={() => (<h1>Error!!!</h1>)}
          paginationAt="both"
          // sortBy="asc"
          onData={this.props.retrieveData}
          react={queryParams}
          renderItem={tableView ? null : this.resultsListHandler}
          render={tableView ? this.renderTable : null}
          onResultStats={(total, took) => {
            return `Found ${total} results in ${took} ms.`;
          }}
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
