import React from "react";
import ReactJson from "react-json-view";
import { GRQ_ES_URL, GRQ_ES_INDICES } from "../../config/tosca";

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
  }

  _fetchMetadata = (index, id) => {
    const esEndpoint = `${GRQ_ES_URL}/${index}/_doc/${id}`;

    fetch(esEndpoint, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
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
        console.error("Error:", error);
      });
  };

  componentDidMount() {
    const search = this.props.location.search;
    const params = new URLSearchParams(search);
    const index = params.get("index");
    const id = params.get("id");
    this._fetchMetadata(index, id);
  }

  render() {
    const { loading, metadata } = this.state;
    const results = loading ? (
      "loading..."
    ) : (
      <ReactJson src={metadata} displayDataTypes={false} />
    );

    return <div>{results}</div>;
  }
}
