import React from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { ReactiveBase, SelectedFilters } from "@appbaseio/reactivesearch";

import SidebarFilters from "../../components/SidebarFilters";
import SearchQuery from "../../components/SearchQuery";
import WorkflowCounts from "../../components/WorkflowCounts";
import WorkflowResultsList from "../../components/WorkflowResultsList";
import { ScrollTop } from "../../components/Buttons";
import HeaderBar, {
  HeaderLink,
  DropdownSources,
} from "../../components/HeaderBar";
import { LastUpdatedAtBanner } from "../../components/miscellaneous";

import { resetDataFreshness } from "../../redux/actions";
import { appendClosedIndexParams } from "../../utils/esHelpers";
import { resolveFilters, candidateFields } from "../../utils/workflow";
import { LOCAL_DEV, MOZART_ES_URL } from "../../config";
import {
  WORKFLOW_ES_INDEX,
  FILTER_CANDIDATES,
  EXTRA_QUERY_COMPONENTS,
  SORT_CANDIDATES,
} from "../../config/workflows";

import "../Figaro/style.css";
import "./style.css";

const PROBE_FIELDS = candidateFields(FILTER_CANDIDATES, SORT_CANDIDATES);

// One cheap query up front: how many runs have each field the facets could use? The
// backend is adding fields (spec_name, failed_node, ended_at, ...) over time, and a facet
// over a field nobody writes is just an empty box. Facets switch on by themselves.
const probeFields = (url) =>
  fetch(`${url}/${WORKFLOW_ES_INDEX}/_search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      size: 0,
      aggs: PROBE_FIELDS.reduce(
        (a, f, i) => ({ ...a, [`f${i}`]: { filter: { exists: { field: f } } } }),
        {}
      ),
    }),
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) =>
      PROBE_FIELDS.reduce(
        (a, f, i) => ({ ...a, [f]: data.aggregations[`f${i}`].doc_count }),
        {}
      )
    );

// used if the probe fails, so the page still works on the fields that always exist
const FALLBACK_COUNTS = {
  status: 1,
  spec_id: 1,
  "user.keyword": 1,
  submitted_at: 1,
  updated_at: 1,
};

class Workflows extends React.Component {
  constructor(props) {
    super(props);
    this.pageRef = React.createRef();
    this.mozart_es_url = LOCAL_DEV
      ? MOZART_ES_URL
      : `${window.origin}/${MOZART_ES_URL}`;
    this.state = { fieldCounts: null };
  }

  componentDidMount() {
    this.props.resetDataFreshness();
    probeFields(MOZART_ES_URL)
      .then((fieldCounts) => this.setState({ fieldCounts }))
      .catch((err) => {
        console.error("workflow field probe failed:", err);
        this.setState({ fieldCounts: FALLBACK_COUNTS });
      });
  }

  handleTransformRequest = (e) => {
    e.url = appendClosedIndexParams(e.url);
    return e;
  };

  render() {
    const { darkMode, dataUpdatedAt } = this.props;
    const { fieldCounts } = this.state;
    const classTheme = darkMode ? "__theme-dark" : "__theme-light";

    let body = <div className="wf-page-loading">Loading...</div>;
    if (fieldCounts) {
      const filters = resolveFilters(FILTER_CANDIDATES, fieldCounts);
      const queryLogic = {
        and: [...filters.map((f) => f.componentId), ...EXTRA_QUERY_COMPONENTS],
      };
      const sortFields = SORT_CANDIDATES.filter((f) => fieldCounts[f] > 0);
      if (!sortFields.includes("submitted_at")) sortFields.unshift("submitted_at");

      body = (
        <ReactiveBase
          url={this.mozart_es_url}
          app={WORKFLOW_ES_INDEX}
          transformRequest={this.handleTransformRequest}
        >
          <div className="figaro-page-wrapper">
            <div className={`${classTheme} figaro-sidenav`}>
              <div className="sidenav-title">Filters</div>
              <SidebarFilters filters={filters} queryLogic={queryLogic} />
            </div>

            <div className="figaro-body" ref={this.pageRef}>
              <LastUpdatedAtBanner time={dataUpdatedAt} />
              <WorkflowCounts />

              <div className="top-bar-wrapper">
                <SearchQuery componentId="query_string" theme={classTheme} />
              </div>

              <div className="filter-list-wrapper">
                <SelectedFilters className="filter-list" />
              </div>

              <WorkflowResultsList queryLogic={queryLogic} sortFields={sortFields} />
            </div>
            <ScrollTop onClick={() => this.pageRef.current.scrollTo(0, 0)} />
          </div>
        </ReactiveBase>
      );
    }

    return (
      <>
        <Helmet>
          <title>Workflows - Home</title>
          <meta name="description" content="Helmet application" />
        </Helmet>
        <HeaderBar title="HySDS" theme={classTheme}>
          <HeaderLink href="/tosca" title="Tosca" active={0} />
          <HeaderLink href="/figaro" title="Figaro" active={0} />
          <HeaderLink href="/workflows" title="Workflows" active={1} />
          <DropdownSources />
        </HeaderBar>
        {body}
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  darkMode: state.themeReducer.darkMode,
  dataUpdatedAt: state.generalReducer.dataUpdatedAt,
});

const mapDispatchToProps = (dispatch) => ({
  resetDataFreshness: () => dispatch(resetDataFreshness()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Workflows);
