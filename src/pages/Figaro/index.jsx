import React, { Fragment } from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import {
  ReactiveBase,
  SelectedFilters,
  ReactiveList
} from "@appbaseio/reactivesearch";

import FigaroFilters from "../../components/SidebarFilters";
import SearchQuery from "../../components/SearchQuery";
import CustomIdFilter from "../../components/CustomIdFilter";
import HeaderBar from "../../components/HeaderBar";
import { HelperLink } from "../../components/miscellaneous";

import { editCustomFilterId } from "../../redux/actions";

import {
  MOZART_ES_URL,
  MOZART_ES_INDICES,
  FILTERS,
  QUERY_LOGIC
} from "../../config/figaro";

import "./style.scss";

class Figaro extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.pageRef = React.createRef();
  }

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

        <ReactiveBase app={MOZART_ES_INDICES} url={MOZART_ES_URL}>
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
              <ReactiveList
                componentId="figaro-results"
                dataField="figaro-reactive-list"
                pagination={true}
                pages={7}
                paginationAt="both"
                react={QUERY_LOGIC}
                renderItem={res => (
                  <div
                    key={`${res._index}-${res._id}`}
                    style={{
                      border: "1px solid black",
                      padding: 15,
                      margin: 10
                    }}
                  >
                    <div>
                      <b>status:</b> {res.status}
                    </div>
                    {res.resource ? (
                      <div>
                        <b>resource: </b> {res.resource}
                      </div>
                    ) : null}
                    <div>
                      <b>index:</b> {res._index}
                    </div>
                    <div
                      onClick={() =>
                        this.props.editCustomFilterId("_id", res._id)
                      }
                    >
                      <b>id:</b> {res._id}
                    </div>
                    {res.payload_id ? (
                      <div
                        onClick={() =>
                          this.props.editCustomFilterId(
                            "payload_id",
                            res.payload_id
                          )
                        }
                      >
                        <b>payload id:</b> {res.payload_id}
                      </div>
                    ) : null}
                    <div>
                      <b>timestamp:</b> {res["@timestamp"]}
                    </div>
                    {res.job ? (
                      <div>
                        <b>job id:</b> {res.job.name}
                      </div>
                    ) : null}
                    {res.job && res.job.job_info ? (
                      <div>
                        <b>node:</b> {res.job.job_info.execute_node}
                      </div>
                    ) : null}
                    {res.job && res.job.job_info ? (
                      <div>
                        <b>queue:</b> {res.job.job_info.job_queue}
                      </div>
                    ) : null}
                    {res.job ? (
                      <div>
                        <b>priority:</b> {res.job.priority}
                      </div>
                    ) : null}
                    {res.job && res.job.job_info ? (
                      <div>
                        <b>duration:</b> {res.job.job_info.duration}
                      </div>
                    ) : null}
                  </div>
                )}
              />
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
