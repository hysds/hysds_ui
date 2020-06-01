import React, { Fragment } from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { ReactiveBase, SelectedFilters } from "@appbaseio/reactivesearch";

import SidebarFilters from "../../components/SidebarFilters";
import SearchQuery from "../../components/SearchQuery";
import CustomIdFilter from "../../components/CustomIdFilter";
import HeaderBar from "../../components/HeaderBar";
import FigaroResultsList from "../../components/FigaroResultsList";
import { HelperLink } from "../../components/miscellaneous";
import { ButtonLink, ScrollTop } from "../../components/Buttons";

import { setQuery, editCustomFilterId } from "../../redux/actions";

import { MOZART_ES_URL, MOZART_ES_INDICES } from "../../config";
import { FILTERS, QUERY_LOGIC } from "../../config/figaro";

import "./style.scss";

class Figaro extends React.Component {
  constructor(props) {
    super(props);
    this.pageRef = React.createRef();
  }

  _handleTransformRequest = (e) => {
    const body = e.body.split("\n");
    let [preference, query] = body;
    query = JSON.parse(query);

    let parsedQuery = query.query;
    parsedQuery = JSON.stringify(parsedQuery);
    this.props.setQuery(parsedQuery);
    return e;
  };

  render() {
    const { darkMode, query, dataCount } = this.props;
    const classTheme = darkMode ? "__theme-dark" : "__theme-light";

    return (
      <Fragment>
        <Helmet>
          <title>Figaro - Home</title>
          <meta name="description" content="Helmet application" />
        </Helmet>
        <HeaderBar title="HySDS" theme={classTheme} active="figaro"></HeaderBar>

        <ReactiveBase
          app={MOZART_ES_INDICES}
          url={MOZART_ES_URL}
          transformRequest={this._handleTransformRequest}
        >
          <div className="figaro-page-wrapper">
            <div className={`${classTheme} figaro-sidenav`}>
              <div className="sidenav-title">Filters</div>
              <SidebarFilters filters={FILTERS} queryLogic={QUERY_LOGIC} />
            </div>

            <div className="figaro-body" ref={this.pageRef}>
              <div className="top-bar-wrapper">
                <HelperLink link="https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html" />
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
      </Fragment>
    );
  }
}

Figaro.defaultProps = {
  theme: "__theme-light",
};

const mapStateToProps = (state) => ({
  darkMode: state.themeReducer.darkMode,
  query: state.generalReducer.query,
  dataCount: state.generalReducer.dataCount,
});

const mapDispatchToProps = (dispatch) => ({
  setQuery: (query) => dispatch(setQuery(query)),
  editCustomFilterId: (componentId, value) =>
    dispatch(editCustomFilterId(componentId, value)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Figaro);
