import React, { Fragment } from "react";
import { Helmet } from "react-helmet";
import { ReactiveBase, SelectedFilters } from "@appbaseio/reactivesearch";
import { connect } from "react-redux";
import {
  getQuery,
  clearAllCustomComponents,
  clearCustomComponent
} from "../../redux/actions";

import {
  GRQ_ES_URL,
  GRQ_ES_INDICES,
  GRQ_TABLE_VIEW_DEFAULT,
  ID_COMPONENT, // all fields read by Reactivesearch
  MAP_COMPONENT_ID,
  QUERY_SEARCH_COMPONENT_ID,
  RESULTS_LIST_COMPONENT_ID,
  FIELDS, // only fields we care about
  DISPLAY_MAP, // display map or do not render
  FILTERS,
  QUERY_LOGIC
} from "../../config/tosca";

// custom components we built to handle elasticsearch data
import ToscaResultsList from "../../components/ToscaResultsList";
import ReactiveMap from "../../components/ReactiveMap";
import IdQueryHandler from "../../components/IdQueryHandler";
import SearchQuery from "../../components/SearchQuery";

// custom utility components
import { ButtonLink, ScrollTop } from "../../components/Buttons";

import FigaroFilters from "../../components/SidebarFilters";

import { HelperLink } from "../../components/miscellaneous";
import HeaderBar from "../../components/HeaderBar";

import "./style.scss";

class Tosca extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tableView: GRQ_TABLE_VIEW_DEFAULT // boolean
    };
    this.mapRef = React.createRef();
    this.pageRef = React.createRef();
  }

  componentDidUpdate() {
    // scrolls to top of page if the query region button is pressed
    if (this.props.queryRegion)
      this.mapRef.current.scrollIntoView({ block: "start" });
  }

  _handleTransformRequest = event => {
    const body = event.body.split("\n");
    let [preference, query] = body;
    query = JSON.parse(query);

    // main query ran to get the data
    if (query._source && FIELDS.length > 0) {
      query._source.includes = FIELDS;

      let parsedQuery = query.query;
      parsedQuery = JSON.stringify(parsedQuery);
      this.props.getQuery(parsedQuery);
      event.body = `${preference}\n${JSON.stringify(query)}\n`;
    }
    return event;
  };

  _handleClearFilter = event => {
    // clears specific filter
    if (event) this.props.clearCustomComponent(event);
    else this.props.clearAllCustomComponents(); // clear all filters
  };

  render() {
    const { darkMode, data, dataCount, query } = this.props;

    const reactiveMap = DISPLAY_MAP ? (
      <ReactiveMap
        componentId={MAP_COMPONENT_ID}
        zoom={5}
        maxZoom={10}
        minZoom={2}
        data={data}
      />
    ) : null;

    const classTheme = darkMode ? "__theme-dark" : "__theme-light";

    return (
      <Fragment>
        <Helmet>
          <title>Tosca - Home</title>
          <meta name="description" content="Helmet application" />
        </Helmet>
        <HeaderBar title="HySDS" theme={classTheme} active="tosca"></HeaderBar>

        <ReactiveBase
          app={GRQ_ES_INDICES}
          url={GRQ_ES_URL}
          transformRequest={this._handleTransformRequest}
        >
          <div className="tosca-page-wrapper">
            <div className={`${classTheme} tosca-sidenav`}>
              <div className="sidenav-title">Filters</div>
              <FigaroFilters filters={FILTERS} />
            </div>

            <div className={`${classTheme} tosca-body`} ref={this.pageRef}>
              <div className="top-bar-wrapper">
                <HelperLink link="https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html" />
                <SearchQuery
                  componentId={QUERY_SEARCH_COMPONENT_ID}
                  theme={classTheme}
                />
                <IdQueryHandler componentId={ID_COMPONENT} />
                <div className="button-wrapper">
                  <div className="tosca-button">
                    <ButtonLink
                      label="On Demand"
                      target="on-demand-tosca"
                      size="small"
                      color="success"
                      href={`/tosca/on-demand?query=${query}&total=${dataCount}`}
                    />
                  </div>
                  <div className="tosca-button">
                    <ButtonLink
                      label="Create Rule"
                      target="tosca-user-rules"
                      size="small"
                      href={`tosca/user-rule?query=${query}`}
                    />
                  </div>
                  <div className="tosca-button">
                    <ButtonLink
                      label="View Rules"
                      target="tosca-user-rules"
                      size="small"
                      href={"tosca/user-rules"}
                    />
                  </div>
                </div>
              </div>

              <div className="filter-list-wrapper">
                <SelectedFilters
                  className="filter-list"
                  onClear={this._handleClearFilter}
                />
              </div>
              <div ref={this.mapRef}>{reactiveMap}</div>
              <ToscaResultsList
                componentId={RESULTS_LIST_COMPONENT_ID}
                queryParams={QUERY_LOGIC}
                // retrieveData={this.retrieveData}
                pageSize={10}
                theme={classTheme}
              />
            </div>
            <ScrollTop onClick={() => this.pageRef.current.scrollTo(0, 0)} />
          </div>
        </ReactiveBase>
      </Fragment>
    );
  }
}

Tosca.defaultProps = {
  theme: "__theme-light"
};

// redux state data
const mapStateToProps = state => ({
  darkMode: state.themeReducer.darkMode,
  data: state.toscaReducer.data,
  dataCount: state.toscaReducer.dataCount,
  query: state.toscaReducer.query,
  queryRegion: state.reactivesearchReducer.queryRegion
});

// Redux actions
const mapDispatchToProps = dispatch => {
  return {
    getQuery: query => dispatch(getQuery(query)),
    clearAllCustomComponents: () => dispatch(clearAllCustomComponents()),
    clearCustomComponent: component => dispatch(clearCustomComponent(component))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Tosca);
