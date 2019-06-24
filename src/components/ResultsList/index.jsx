import React from 'react';
import PropTypes from 'prop-types';
import { ReactiveList } from '@appbaseio/reactivesearch';
import ToggleListView from '../ToggleListView/index.jsx';

/**
 * Display results from ES (TOSCA)
 *  TODO:
 *    Make compatible with GRQ data
 *    Make it expandable to show more info (ToggleListView component)
 */
class ResultsList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.resultsListHandler = this.resultsListHandler.bind(this);
  }

  resultsListHandler = res => { // callback function to handle the results from ES
    // this.props.dataCallback(res);
    return (
      <div key={res._id}>
        <ToggleListView res={res} />
      </div>
    );
  }

  render() {
    const { componentId, queryParams, pageSize } = this.props;
    return (
      <ReactiveList
        componentId={componentId}
        dataField="Dest"
        size={pageSize}
        pages={7}
        stream={true}
        pagination={true}
        scrollOnChange={false}
        // onNoResults={}
        onError={() => (<h1>Error!!!</h1>)}
        paginationAt="both"
        // sortBy="asc"
        onData={this.props.retrieveData}
        react={queryParams}
        renderItem={this.resultsListHandler}
        onResultStats={(total, took) => {
          return `Found ${total} results in ${took} ms.`;
        }}
      />
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
