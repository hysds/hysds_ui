import React, { Fragment } from "react";
import { Helmet } from "react-helmet";

import QueryEditor from "../../components/QueryEditor";
import JobInput from "../../components/JobInput";
import JobParams from "../../components/JobParams";
import { Border, SubmitStatusBar } from "../../components/miscellaneous";

import TagInput from "../../components/TagInput";
import QueueInput from "../../components/QueueInput";
import PriorityInput from "../../components/PriorityInput";

import { Button } from "../../components/Buttons";
import HeaderBar from "../../components/HeaderBar";

import { connect } from "react-redux";

import {
  // changeJobType,
  // changeQueue,
  // editDataCount,
  editJobPriority,
  // editParams,
  editQuery,
  editTags,
  // getOnDemandJobs,
  // getParamsList,
  getQueueList,
  validateQuery
} from "../../redux/actions";

import "./style.scss";

class FigaroOnDemand extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      submitInProgress: 0,
      submitSuccess: 0,
      submitFailed: 0
    };
  }

  componentDidMount() {
    // this.props.getOnDemandJobs();
    if (this.props.jobType) {
      // this.props.getQueueList(this.props.jobType);
      // this.props.getParamsList(this.props.jobType);
    }
  }

  _validateSubmission = () => {
    let {
      validQuery,
      jobType,
      tags,
      queue,
      priority,
      params,
      paramsList
    } = this.props;

    let validSubmission = true;
    if (!validQuery || !tags || !jobType || !priority || !queue) return false;

    paramsList.map(param => {
      const paramName = param.name;
      if (!(param.optional === true) && !params[paramName])
        validSubmission = false;
    });
    return validSubmission;
  };

  render() {
    let {
      darkMode,
      query,
      paramsList,
      params,
      hysdsio,
      validQuery,
      submissionType
    } = this.props;

    const classTheme = darkMode ? "__theme-dark" : "__theme-light";
    const darkTheme = "twilight";
    const lightTheme = "tomorrow";
    const aceTheme = darkMode ? darkTheme : lightTheme;

    return (
      <Fragment>
        <Helmet>
          <title>Tosca - On Demand</title>
          <meta name="description" content="Helmet application" />
        </Helmet>
        <HeaderBar
          title="HySDS - On Demand"
          theme={classTheme}
          active="figaro"
        />

        <div className={classTheme}>
          <div className="figaro-on-demand">
            <div className="split on-demand-left">
              <QueryEditor
                url={true} // update query params in url
                query={query}
                editQuery={editQuery} // redux action
                validateQuery={validateQuery}
                theme={aceTheme}
              />
            </div>

            <div className="split on-demand-right">
              <div className="on-demand-submitter-wrapper">
                <h1>Figaro - On-Demand Job</h1>
                <div className="data-count-header">
                  Total Records: {this.props.dataCount || "N/A"}
                </div>

                <TagInput
                  url={true}
                  tags={this.props.tags}
                  editTags={editTags}
                />

                <div className="on-demand-select-wrapper">
                  <JobInput
                    url={true} // update query params in url
                    // changeJobType={changeJobType} // all redux actions
                    // getParamsList={getParamsList}
                    // getQueueList={getQueueList}
                    jobs={this.props.jobs}
                    jobType={this.props.jobType}
                    jobLabel={this.props.jobLabel}
                  />
                </div>
                <div className="on-demand-select-wrapper">
                  <QueueInput
                    queue={this.props.queue}
                    queueList={this.props.queueList}
                    // changeQueue={changeQueue}
                  />
                </div>
                <div className="on-demand-select-wrapper">
                  <PriorityInput
                    url={true}
                    priority={this.props.priority}
                    editJobPriority={editJobPriority}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

const mapStateToProps = state => ({
  darkMode: state.themeReducer.darkMode,
  query: state.toscaReducer.query,
  validQuery: state.toscaReducer.validQuery,
  jobs: state.toscaReducer.jobList,
  jobType: state.toscaReducer.jobType,
  jobLabel: state.toscaReducer.jobLabel,
  hysdsio: state.toscaReducer.hysdsio,
  queueList: state.toscaReducer.queueList,
  queue: state.toscaReducer.queue,
  priority: state.toscaReducer.priority,
  paramsList: state.toscaReducer.paramsList,
  params: state.toscaReducer.params,
  tags: state.toscaReducer.tags,
  submissionType: state.toscaReducer.submissionType,
  dataCount: state.toscaReducer.dataCount
});

const mapDispatchToProps = dispatch => ({
  // getOnDemandJobs: () => dispatch(getOnDemandJobs()),
  getQueueList: jobType => dispatch(getQueueList(jobType))
  // getParamsList: jobType => dispatch(getParamsList(jobType)),
  // editDataCount: query => dispatch(editDataCount(query))
});

export default connect(mapStateToProps, mapDispatchToProps)(FigaroOnDemand);
