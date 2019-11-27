import React, { Fragment } from "react";

import QueryEditor from "../../components/QueryEditor/index.jsx";
import JobSubmitter from "../../components/JobSubmitter/index.jsx";
import JobParams from "../../components/JobParams/index.jsx";
import {
  Border,
  SubmitStatusBar
} from "../../components/miscellaneous/index.jsx";
import { SubmitOnDemandJobButton } from "../../components/Buttons/index.jsx";

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

import { GRQ_REST_API_V1 } from "../../config";

import "./style.css";

class ToscaOnDemand extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      submitInProgress: 0,
      submitSuccess: 0,
      submitFailed: 0
    };
  }

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
    if (!validQuery || !tags || !jobType || !priority) return false;

    paramsList.map(param => {
      const paramName = param.name;
      if (!(param.optional === true) && !params[paramName])
        validSubmission = false;
    });
    return validSubmission;
  };

  _handleJobSubmit = () => {
    this.setState({ submitInProgress: 1 });

    const headers = { "Content-Type": "application/json" };
    const data = {
      tags: this.props.tags,
      job_type: this.props.jobType,
      hysds_io: this.props.hysdsio,
      queue: this.props.queue,
      priority: this.props.priority,
      query: this.props.query,
      kwargs: this.props.params
    };
    console.log(data);

    const jobSubmitUrl = `${GRQ_REST_API_V1}/grq/on-demand`;
    fetch(jobSubmitUrl, { method: "POST", headers, body: JSON.stringify(data) })
      .then(res => res.json())
      .then(data => {
        console.log(data);
        this.setState({ submitInProgress: 0, submitSuccess: 1 });
        setTimeout(() => this.setState({ submitSuccess: 0 }), 3000);
      })
      .catch(err => {
        console.log(err);
        this.setState({ submitInProgress: 0, submitFailed: 1 });
        setTimeout(() => this.setState({ submitFailed: 0 }), 3000);
      });
  };

  render() {
    let { query, paramsList, params, hysdsio } = this.props;
    const { submitInProgress, submitSuccess, submitFailed } = this.state;

    const divider = paramsList.length > 0 ? <Border /> : null;
    const hysdsioLabel = paramsList.length > 0 ? <h2>{hysdsio}</h2> : null;

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
            {divider}
            {hysdsioLabel}
            <JobParams
              editParams={editParams}
              paramsList={paramsList}
              params={params}
            />
            <SubmitOnDemandJobButton
              disabled={!validSubmission}
              onClick={this._handleJobSubmit}
              loading={submitInProgress}
            />
          </div>
        </div>
        <SubmitStatusBar label="Job Submitted!" visible={submitSuccess} />
        <SubmitStatusBar
          label="Job Submission Failed"
          visible={submitFailed}
          status="failed"
        />
      </Fragment>
    );
  }
}

const mapStateToProps = state => ({
  query: state.toscaReducer.query,
  validQuery: state.toscaReducer.validQuery,
  jobs: state.toscaReducer.jobList,
  jobType: state.toscaReducer.jobType,
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
  getOnDemandJobs: () => dispatch(getOnDemandJobs())
});

export default connect(mapStateToProps, mapDispatchToProps)(ToscaOnDemand);
