import React from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { ReactiveBase, SelectedFilters } from "@appbaseio/reactivesearch";

import JobCountsBanner from "../../components/JobCountsBanner";
import SidebarFilters from "../../components/SidebarFilters";
import SearchQuery from "../../components/SearchQuery";
import CustomIdFilter from "../../components/CustomIdFilter";
import FigaroResultsList from "../../components/FigaroResultsList";
import { ButtonLink, ScrollTop } from "../../components/Buttons";

import { editCustomFilterId, resetDataFreshness } from "../../redux/actions";
import { getJobCounts } from "../../redux/actions/figaro";

import HeaderBar, {
  HeaderLink,
  DropdownSources,
} from "../../components/HeaderBar";
import { LastUpdatedAtBanner } from "../../components/miscellaneous";

import { parseFacetQuery } from "../../utils";
import { appendClosedIndexParams } from "../../utils/esHelpers";
import {
  figaroFilters,
  probeFieldCounts,
  FIGARO_WORKFLOW_PROBE_FIELD,
} from "../../utils/workflow";
import { LOCAL_DEV, MOZART_ES_URL, MOZART_ES_INDICES } from "../../config";
import { FILTERS, QUERY_LOGIC } from "../../config/figaro";

import "./style.css";

class Figaro extends React.Component {
  constructor(props) {
    super(props);
    this.pageRef = React.createRef();

    this.mozart_es_url = LOCAL_DEV
      ? MOZART_ES_URL
      : `${window.origin}/${MOZART_ES_URL}`;

    this.state = {
      query: null,
      hasWorkflowJobs: false, // until the probe says so; a deep link shows the facets anyway
    };
    // read once: clearing a deep-linked workflow filter must not unmount its facet
    this.initialSearch = window.location.search;
  }

  componentDidMount() {
    this.props.resetDataFreshness();
    this.props.getJobCounts();
    this.probeWorkflowJobs();
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  // a mission without workflows (or with only pre-workflow job_status indices) has no doc
  // with a workflow.run_id: its workflow facets would only be empty boxes, so hide them
  probeWorkflowJobs = () => {
    const url = appendClosedIndexParams(
      `${MOZART_ES_URL}/${MOZART_ES_INDICES}/_search`
    );
    probeFieldCounts(url, [FIGARO_WORKFLOW_PROBE_FIELD])
      .then((counts) => {
        if (this.unmounted) return;
        this.setState({
          hasWorkflowJobs: counts[FIGARO_WORKFLOW_PROBE_FIELD] > 0,
        });
      })
      .catch((err) => console.error("workflow jobs probe failed:", err));
  };

  handleTransformRequest = (e) => {
    const query = parseFacetQuery(e.body, "figaro-results");
    if (query) this.setState({ query });

    e.url = appendClosedIndexParams(e.url);

    return e;
  };

  render() {
    const { darkMode, dataCount, dataUpdatedAt } = this.props;
    const { query, hasWorkflowJobs } = this.state;
    const filters = figaroFilters(
      FILTERS,
      hasWorkflowJobs,
      this.initialSearch
    );
    const classTheme = darkMode ? "__theme-dark" : "__theme-light";

    return (
      <>
        <Helmet>
          <title>Figaro - Home</title>
          <meta name="description" content="Helmet application" />
        </Helmet>
        <HeaderBar title="HySDS" theme={classTheme}>
          <HeaderLink href="/tosca" title="Tosca" active={0} />
          <HeaderLink href="/figaro" title="Figaro" active={1} />
          <HeaderLink href="/workflows" title="Workflows" active={0} />
          <DropdownSources />
        </HeaderBar>

        <ReactiveBase
          url={this.mozart_es_url}
          app={MOZART_ES_INDICES}
          transformRequest={this.handleTransformRequest}
        >
          <div className="figaro-page-wrapper">
            <div className={`${classTheme} figaro-sidenav`}>
              <div className="sidenav-title">Filters</div>
              <SidebarFilters filters={filters} queryLogic={QUERY_LOGIC} />
            </div>

            <div className="figaro-body" ref={this.pageRef}>
              <LastUpdatedAtBanner time={dataUpdatedAt} />
              <JobCountsBanner updateCount={this.props.getJobCounts} />

              <div className="top-bar-wrapper">
                <SearchQuery componentId="query_string" theme={classTheme} />

                <div className="button-wrapper">
                  <div className="figaro-button">
                    <ButtonLink
                      label="On Demand"
                      target="on-demand-figaro"
                      size="small"
                      color="success"
                      href={`/figaro/on-demand?query=${query}&total=${dataCount}`}
                    />
                  </div>
                  <div className="figaro-button">
                    <ButtonLink
                      label="Create Rule"
                      target="figaro-user-rules"
                      size="small"
                      href={`figaro/user-rule?query=${query}`}
                    />
                  </div>
                  <div className="figaro-button">
                    <ButtonLink
                      label="View Rules"
                      target="figaro-user-rules"
                      size="small"
                      href={"figaro/user-rules"}
                    />
                  </div>
                </div>
              </div>

              <div className="filter-list-wrapper">
                <SelectedFilters className="filter-list" />
                <CustomIdFilter
                  componentId="payload_id"
                  dataField="payload_id"
                />
                <CustomIdFilter componentId="_id" dataField="_id" />
              </div>

              <FigaroResultsList />
            </div>
            <ScrollTop onClick={() => this.pageRef.current.scrollTo(0, 0)} />
          </div>
        </ReactiveBase>
      </>
    );
  }
}

Figaro.defaultProps = {
  theme: "__theme-light",
};

const mapStateToProps = (state) => ({
  darkMode: state.themeReducer.darkMode,
  dataCount: state.generalReducer.dataCount,
  dataUpdatedAt: state.generalReducer.dataUpdatedAt,
});

const mapDispatchToProps = (dispatch) => ({
  getJobCounts: () => dispatch(getJobCounts()),
  resetDataFreshness: () => dispatch(resetDataFreshness()),
  editCustomFilterId: (componentId, value) =>
    dispatch(editCustomFilterId(componentId, value)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Figaro);
