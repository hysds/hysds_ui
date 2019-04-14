import React from 'react';
import ReactJson from 'react-json-view'


/**
 * TODO:
 *    separate the page into 2 panes (1 for json other for job)
 *    searchable dropdowns
 *    add compatible options to tosca jobs
 */
export default class OnDemand extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      // query: props.match.params.query,
    };
  }

  render() {
    const query = this.props.match.params.query;

    let decodedQuery = JSON.parse(atob(query));
    delete decodedQuery.from;
    delete decodedQuery.size;

    const results = <ReactJson src={decodedQuery} displayDataTypes={false} />;

    return (
      <div>
        {results}
      </div>
    );
  }
}
