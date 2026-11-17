import React from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
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
import { resolveFilters, candidateFields, probeFieldCounts } from "../../utils/workflow";
import { LOCAL_DEV, MOZART_ES_URL } from "../../config";
import {
  WORKFLOW_ES_INDEX,
  FILTER_CANDIDATES,
  EXTRA_QUERY_COMPONENTS,
  SORT_CANDIDATES,
  DEFAULT_SORT,
} from "../../config/workflows";

import "../Figaro/style.css";
import "./style.css";

const PROBE_FIELDS = candidateFields(FILTER_CANDIDATES, SORT_CANDIDATES);

// One cheap query up front: how many runs have each field the facets could use? Some
// (failed_step, error_class, ended_at, ...) only exist once a run has failed or ended, and
// a facet over a field nobody has is just an empty box. Facets switch on by themselves.
const probeFields = (url) =>
  probeFieldCounts(`${url}/${WORKFLOW_ES_INDEX}/_search`, PROBE_FIELDS);

// used if the probe fails, so the page still works on the fields that always exist
const FALLBACK_COUNTS = {
  status: 1,
  spec_id: 1,
  spec_version: 1,
  username: 1,
  created_at: 1,
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
      if (!sortFields.includes(DEFAULT_SORT)) sortFields.unshift(DEFAULT_SORT);

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
              <div className="wf-page-links">
                <Link className="wf-link" to="/workflows/cwl">
                  Registered workflows (CWL)
                </Link>
              </div>

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
