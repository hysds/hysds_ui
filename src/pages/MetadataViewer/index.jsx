import React from 'react';
import ReactJson from 'react-json-view'
import { GRQ_ES_URL, GRQ_ES_INDICES } from '../../config.js';


/**
 * add second panel to show the map and webdav link, etc.
 */
export default class MetadataViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      id: props.match.params.id,
      metadata: null
    };
    this._fetchMetadata = this._fetchMetadata.bind(this);
  }

  _fetchMetadata(id) {
    const esEndpoint = `${GRQ_ES_URL}/${GRQ_ES_INDICES}/_search`;
    let query = {
      query: {
        term: {
          _id: id
        }
      }
    }
    fetch(esEndpoint, {
      method: 'POST',
      body: JSON.stringify(query),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(response => {
        this.setState({
          metadata: response,
          loading: false
        });
      })
      .catch(error => {
        this.setState({
          loading: false
        });
        console.error('Error:', error);
      });
  }

  componentDidMount() {
    this._fetchMetadata(this.props.match.params.id);
  }

  render() {
    const { loading, metadata } = this.state;
    const results = loading ? 'loading...' : (<ReactJson src={metadata} displayDataTypes={false} />);

    return (
      <div>
        {results}
      </div>
    );
  }
}
