import React, { Fragment } from "react";

import QueryEditor from "../../components/QueryEditor/index.jsx";
import JobSubmitter from "../../components/JobSubmitter/index.jsx";
import { SubmitButton } from "../../components/Buttons/index.jsx";

import { connect } from "react-redux";
import {
  editQuery,
  validateQuery,
  editJobPriority,
  getOnDemandJobs,
  changeJobType,
  getParamsList,
  editParams,
  getQueueList,
  changeQueue,
  editTags
} from "../../redux/actions";

import "./style.css";

class ToscaOnDemand extends React.Component {
  componentDidMount() {
    this.props.getOnDemandJobs();
  }

  _validateSubmission = () => {
    let {
      validQuery,
      jobType,
      tags,
      priority,
      params,
      paramsList
    } = this.props;

    let validSubmission = true;
    if (!validQuery || !tags || !jobType || !priority) validSubmission = false;

    paramsList.map(param => {
      const paramName = param.name;
      if (!(param.optional === true)) {
        if (!params[paramName]) validSubmission = false;
      }
    });
    return validSubmission;
  };

  render() {
    let { query } = this.props;
    const validSubmission = this._validateSubmission();

    return (
      <Fragment>
        <div className="split on-demand-left">
          <QueryEditor
            query={query}
            editQuery={editQuery} // redux action
            validateQuery={validateQuery}
          />
        </div>

        <div className="split on-demand-right">
          <div className="on-demand-submitter-wrapper">
            total records: {this.props.dataCount}
            <JobSubmitter
              changeJobType={changeJobType} // all redux actions
              getParamsList={getParamsList}
              editParams={editParams}
              getQueueList={getQueueList}
              changeQueue={changeQueue}
              editJobPriority={editJobPriority}
              editTags={editTags}
              {...this.props}
            />
            <SubmitButton disabled={!validSubmission} />
          </div>
        </div>
      </Fragment>
    );
  }
}

const mapStateToProps = state => ({
  query: state.toscaReducer.query,
  validQuery: state.toscaReducer.validQuery,
  jobs: state.toscaReducer.jobList,
  jobType: state.toscaReducer.jobType,
  queueList: state.toscaReducer.queueList,
  queue: state.toscaReducer.queue,
  priority: state.toscaReducer.priority,
  paramsList: state.toscaReducer.paramsList,
  params: state.toscaReducer.params,
  tags: state.toscaReducer.tags,
  dataCount: state.toscaReducer.dataCount
});

const mapDispatchToProps = dispatch => ({
  getOnDemandJobs: () => dispatch(getOnDemandJobs())
});

export default connect(mapStateToProps, mapDispatchToProps)(ToscaOnDemand);
