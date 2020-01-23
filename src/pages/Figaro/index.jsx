import React, { Fragment } from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { ReactiveBase, SelectedFilters } from "@appbaseio/reactivesearch";

import FigaroFilters from "../../components/SidebarFilters";
import SearchQuery from "../../components/SearchQuery";
import CustomIdFilter from "../../components/CustomIdFilter";
import HeaderBar from "../../components/HeaderBar";
import FigaroResultsList from "../../components/FigaroResultsList";
import { HelperLink } from "../../components/miscellaneous";

import { editCustomFilterId } from "../../redux/actions";

import {
  MOZART_ES_URL,
  MOZART_ES_INDICES,
  FILTERS,
  FIELDS
} from "../../config/figaro";

import "./style.scss";

class Figaro extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.pageRef = React.createRef();
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
      // this.props.getQuery(parsedQuery);
      event.body = `${preference}\n${JSON.stringify(query)}\n`;
    }
    return event;
  };

  render() {
    const { darkMode } = this.props;
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
              <FigaroFilters filters={FILTERS} />
            </div>

            <div className={`${classTheme} figaro-body`} ref={this.pageRef}>
              <div className="top-bar-wrapper">
                <HelperLink link="https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html" />
                <SearchQuery componentId="query_string" theme={classTheme} />
              </div>

              <div className="filter-list-wrapper">
                <SelectedFilters
                  className="filter-list"
                  onClear={this._handleClearFilter}
                />
                <CustomIdFilter
                  componentId="payload_id"
                  dataField="payload_id"
                />
                <CustomIdFilter componentId="_id" dataField="_id" />
              </div>

              <FigaroResultsList />
            </div>
          </div>
        </ReactiveBase>
      </Fragment>
    );
  }
}

Figaro.defaultProps = {
  theme: "__theme-light"
};

const mapStateToProps = state => ({
  darkMode: state.themeReducer.darkMode
});

const mapDispatchToProps = dispatch => ({
  editCustomFilterId: (componentId, value) =>
    dispatch(editCustomFilterId(componentId, value))
});

export default connect(mapStateToProps, mapDispatchToProps)(Figaro);
