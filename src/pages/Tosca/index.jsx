import React, { Fragment } from "react";
import {
  ReactiveBase,
  SingleList,
  SelectedFilters,
  DateRange,
  MultiList
} from "@appbaseio/reactivesearch";
import { connect } from "react-redux";
import {
  getQuery,
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
  QUERY_SEARCH_COMPONENT_ID,
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

// custom components we built to handle elasticsearch data
import ResultsList from "../../components/ResultsList/index.jsx";
import ReactiveMap from "../../components/ReactiveMap/index.jsx";
import IdQueryHandler from "../../components/IdQueryHandler/index.jsx";
import SearchQuery from "../../components/SearchQuery/index.jsx";

// custom utility components
import {
  OnDemandButton,
  TriggerRulesButton,
  ScrollTop
} from "../../components/Buttons/index.jsx";

import "./style.css"; // main style sheet for the Toca page

// query logic for elasticsearch
const QUERY_LOGIC = {
  and: [
    ID_COMPONENT,
    QUERY_SEARCH_COMPONENT_ID,
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

class Tosca extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tableView: GRQ_TABLE_VIEW_DEFAULT // boolean
    };
  }

  _handleTransformRequest = event => {
    const body = event.body.split("\n");
    let [preference, query] = body;
    query = JSON.parse(query);

    if (query._source) {
      query._source.includes = FIELDS;
      query = JSON.stringify(query);
      this.props.getQuery(query);
      event.body = `${preference}\n${query}\n`;
    }
    return event;
  };

  _handleClearFilter = event => {
    // if user clears specific filter
    if (event) this.props.clearCustomComponent(event);
    // if user clicks clear all filters
    else this.props.clearAllCustomComponents();
  };

  render() {
    const { data, dataCount, query } = this.props;

    return (
      <Fragment>
        <ReactiveBase
          app={GRQ_ES_INDICES}
          url={GRQ_ES_URL}
          transformRequest={this._handleTransformRequest}
        >
          <IdQueryHandler componentId={ID_COMPONENT} />
          <div className="sidenav">
            <SingleList
              componentId={DATASET_ID}
              dataField="dataset.raw"
              title="Dataset"
              URLParams={true}
              className="reactivesearch-input"
            />
            <SingleList
              componentId={DATASET_TYPE_SEARCH_ID}
              dataField="dataset_type.raw"
              title="Dataset Type"
              URLParams={true}
              className="reactivesearch-input"
            />

            <SingleList
              componentId={SATELLITE_TYPE_ID}
              dataField="metadata.platform.raw"
              title="Platforms"
              URLParams={true}
              className="reactivesearch-input"
            />

            <SingleList
              componentId={DATASET_VERSION}
              dataField="version.raw"
              title="Version"
              URLParams={true}
              className="reactivesearch-input"
            />

            <DateRange
              componentId={START_TIME_ID}
              title="Start Time"
              dataField="starttime"
              className="reactivesearch-input reactivesearch-date"
            />
            <DateRange
              componentId={END_TIME_ID}
              title="End Time"
              dataField="endtime"
              className="reactivesearch-input reactivesearch-date"
            />

            <MultiList
              componentId={TRACK_NUMBER_ID}
              dataField="metadata.track_number"
              title="Track Number"
              URLParams={true}
              className="reactivesearch-input"
            />
            <MultiList
              componentId={TRACK_NUMBER_ID_OLD}
              dataField="metadata.trackNumber"
              title="Track Number (Old)"
              URLParams={true}
              className="reactivesearch-input"
            />
          </div>

          <div className="body">
            <div className="top-bar-wrapper">
              <SearchQuery componentId={QUERY_SEARCH_COMPONENT_ID} />
              <div className="button-wraper">
                <OnDemandButton query={query} total={dataCount} />
                <TriggerRulesButton />
              </div>
            </div>
            <SelectedFilters
              className="filter-list"
              onClear={this._handleClearFilter}
            />

            <ScrollTop />
            <br />
            <ReactiveMap
              componentId={MAP_COMPONENT_ID}
              zoom={5}
              maxZoom={20}
              minZoom={2}
              data={data}
            />
            <ResultsList
              componentId={RESULTS_LIST_COMPONENT_ID}
              queryParams={QUERY_LOGIC}
              retrieveData={this.retrieveData}
              pageSize={10}
            />
          </div>
        </ReactiveBase>
      </Fragment>
    );
  }
}

// redux state data
const mapStateToProps = state => ({
  data: state.toscaReducer.data,
  dataCount: state.toscaReducer.dataCount,
  query: state.toscaReducer.query
});

// Redux actions
const mapDispatchToProps = dispatch => {
  return {
    getQuery: query => dispatch(getQuery(query)),
    clearAllCustomComponents: () => dispatch(clearAllCustomComponents()),
    clearCustomComponent: component => dispatch(clearCustomComponent(component))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Tosca);
