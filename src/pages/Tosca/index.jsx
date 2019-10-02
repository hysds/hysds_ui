import React from "react";
import {
  ReactiveBase,
  SingleList,
  SelectedFilters,
  DateRange,
  MultiList
} from "@appbaseio/reactivesearch";
import { connect } from "react-redux";
import {
  clearAllCustomComponents,
  clearCustomComponent
} from "../../redux/actions/index";

import {
  GRQ_ES_URL,
  GRQ_ES_INDICES,
  GRQ_TABLE_VIEW_DEFAULT,
  // all fields read by Reactivesearch
  ID_COMPONENT,
  MAP_COMPONENT_ID,
  SEARCHBAR_COMPONENT_ID,
  DATASET_TYPE_SEARCH_ID,
  SATELLITE_TYPE_ID,
  RESULTS_LIST_COMPONENT_ID,
  DATASET_ID,
  TRACK_NUMBER_ID,
  TRACK_NUMBER_ID_OLD,
  START_TIME_ID,
  END_TIME_ID,
  DATASET_VERSION,
  FIELDS // only fields we care about
} from "../../config";

// custom components we built
import ResultsList from "../../components/ResultsList/index.jsx";
import ReactiveMap from "../../components/ReactiveMap/index.jsx";
import IdQueryHandler from "../../components/IdQueryHandler/index.jsx";

import ScrollTop from "../../components/ScrollTop/index.jsx";

import "./style.css";

// query logic for elasticsearch
const QUERY_LOGIC = {
  and: [
    ID_COMPONENT,
    SEARCHBAR_COMPONENT_ID,
    DATASET_TYPE_SEARCH_ID,
    SATELLITE_TYPE_ID,
    MAP_COMPONENT_ID,
    DATASET_ID,
    START_TIME_ID,
    END_TIME_ID,
    DATASET_VERSION
  ],
  or: [TRACK_NUMBER_ID, TRACK_NUMBER_ID_OLD]
};

// Redux actions
const mapDispatchToProps = dispatch => {
  return {
    clearAllCustomComponents: () => dispatch(clearAllCustomComponents()),
    clearCustomComponent: component => dispatch(clearCustomComponent(component))
  };
};

class ToscaComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      esQuery: null,
      facetData: [],
      tableView: GRQ_TABLE_VIEW_DEFAULT // boolean
    };
  }

  _handleTransformRequest = event => {
    const body = event.body.split("\n");
    const query = body[1];
    let parsedQuery = JSON.parse(query);

    // handles the request to ES (also where to get es query)
    if (parsedQuery._source) {
      parsedQuery._source.includes = FIELDS;
      parsedQuery = JSON.stringify(parsedQuery);
      JSON.stringify(parsedQuery);
      this.setState({
        query: query ? btoa(query) : "" // saving base64 encoded query in state so we can use it 'on demand'
      });
      event.body = `${body[0]}\n${parsedQuery}\n`;
    }
    return event;
  };

  retrieveData = ({ data }) => this.setState({ facetData: data });

  _handleClearFilter = event => {
    // if user clears specific filter
    if (event) this.props.clearCustomComponent(event);
    // if user clicks clear all filters
    else this.props.clearAllCustomComponents();
  };

  render() {
    const { facetData } = this.state;

    // https://discuss.elastic.co/t/view-surrounding-documents-causes-failed-to-parse-date-field-exception/147234 dateoptionalmapping
    return (
      <div className="main-container">
        <ReactiveBase
          app={GRQ_ES_INDICES}
          url={GRQ_ES_URL}
          transformRequest={this._handleTransformRequest}
        >
          <ScrollTop />
          <div className="sidenav">
            <div className="facet-container">
              <SingleList
                componentId={DATASET_ID}
                dataField="dataset.raw"
                title="Dataset"
                URLParams={true}
                style={{ fontSize: 12 }}
                className="reactivesearch-input"
              />
              <SingleList
                componentId={DATASET_TYPE_SEARCH_ID}
                dataField="dataset_type.raw"
                title="Dataset Type"
                URLParams={true}
                style={{ fontSize: 12 }}
                className="reactivesearch-input"
              />

              <SingleList
                componentId={SATELLITE_TYPE_ID}
                dataField="metadata.platform.raw"
                title="Platforms"
                URLParams={true}
                style={{ fontSize: 12 }}
                className="reactivesearch-input"
              />

              <SingleList
                componentId={DATASET_VERSION}
                dataField="version.raw"
                title="Version"
                URLParams={true}
                style={{ fontSize: 12 }}
                className="reactivesearch-input"
              />

              <DateRange
                componentId={START_TIME_ID}
                title="Start Time"
                dataField="starttime"
                style={{ fontSize: 12 }}
              />
              <br />
              <DateRange
                componentId={END_TIME_ID}
                title="End Time"
                dataField="endtime"
                style={{ fontSize: 12 }}
              />

              <br />
              <MultiList
                componentId={TRACK_NUMBER_ID}
                dataField="metadata.track_number"
                title="Track Number"
                URLParams={true}
                style={{ fontSize: 12 }}
                className="reactivesearch-input"
              />
              <MultiList
                componentId={TRACK_NUMBER_ID_OLD}
                dataField="metadata.trackNumber"
                title="Track Number (Old)"
                URLParams={true}
                style={{ fontSize: 12 }}
                className="reactivesearch-input"
              />
            </div>
          </div>

          <div className="body">
            <SelectedFilters
              className="filter-list"
              onClear={this._handleClearFilter}
              style={{ padding: "0px 8px", fontSize: "0.70rem" }}
            />
            <IdQueryHandler componentId={ID_COMPONENT} />

            <div className="utility-button-container">
              <a
                className="utility-button"
                href={`/tosca/on-demand?query=${this.state.query}`}
                target="_blank"
              >
                On Demand
              </a>
              <a className="utility-button" href="#">
                Trigger Rules (Work in Progress)
              </a>
            </div>

            <ReactiveMap
              componentId={MAP_COMPONENT_ID}
              zoom={5}
              maxZoom={8}
              minZoom={2}
              data={facetData}
              clickIdHandler={this.clickIdHandler}
            />
            <br />
            <ResultsList
              componentId={RESULTS_LIST_COMPONENT_ID}
              queryParams={QUERY_LOGIC}
              retrieveData={this.retrieveData}
              pageSize={10}
            />
            <br />
          </div>
        </ReactiveBase>
      </div>
    );
  }
}

const Tosca = connect(
  null,
  mapDispatchToProps
)(ToscaComponent);
export default Tosca;
