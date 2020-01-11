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
  editQuery,
  validateQuery,
  editJobPriority,
  getOnDemandJobs,
  changeJobType,
  getParamsList,
  editParams,
  getQueueList,
  changeQueue,
  editTags,
  editDataCount
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
    if (this.props.jobType) {
      this.props.getQueueList(this.props.jobType);
      this.props.getParamsList(this.props.jobType);
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

  _checkQueryDataCount = () => {
    this.props.editDataCount(this.props.query);
  };

  _handleJobSubmit = () => {
    this.setState({ submitInProgress: 1 });

    const headers = { "Content-Type": "application/json" };
    const data = {
      tags: this.props.tags,
      job_type: this.props.hysdsio,
      hysds_io: this.props.hysdsio,
      queue: this.props.queue,
      priority: this.props.priority,
      query: this.props.query,
      kwargs: JSON.stringify(this.props.params)
    };

    const jobSubmitUrl = `${GRQ_REST_API_V1}/grq/on-demand`;
    fetch(jobSubmitUrl, { method: "POST", headers, body: JSON.stringify(data) })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          this.setState({ submitInProgress: 0, submitFailed: 1 });
          setTimeout(() => this.setState({ submitFailed: 0 }), 3000);
        } else {
          this.setState({ submitInProgress: 0, submitSuccess: 1 });
          setTimeout(() => this.setState({ submitSuccess: 0 }), 3000);
        }
      })
      .catch(err => {
        console.log(err);
        this.setState({ submitInProgress: 0, submitFailed: 1 });
        setTimeout(() => this.setState({ submitFailed: 0 }), 3000);
      });
  };

  render() {
    let {
      query,
      paramsList,
      params,
      hysdsio,
      validQuery,
      submissionType
    } = this.props;
    const { submitInProgress, submitSuccess, submitFailed } = this.state;

    const divider = paramsList.length > 0 ? <Border /> : null;
    const hysdsioLabel = paramsList.length > 0 ? <h2>{hysdsio}</h2> : null;

    const submissionTypeLabel = this.props.jobType ? (
      <button className="on-demand-submission-type">
        Submit Type: <strong>{submissionType || "iteration"}</strong>
      </button>
    ) : null;

    const validSubmission = this._validateSubmission();

    return (
      <Fragment>
        <Helmet>
          <title>Tosca - On Demand</title>
          <meta name="description" content="Helmet application" />
        </Helmet>
        <HeaderBar title="HySDS - On Demand" />
        <div className="tosca-on-demand">
          <div className="split on-demand-left">
            <QueryEditor
              url={true} // update query params in url
              query={query}
              editQuery={editQuery} // redux action
              validateQuery={validateQuery}
            />
          </div>

          <div className="split on-demand-right">
            <div className="on-demand-submitter-wrapper">
              <h1>Tosca - On-Demand Job</h1>
              <div className="data-count-header">
                Total Records: {this.props.dataCount || "N/A"}
              </div>
              <TagInput url={true} tags={this.props.tags} editTags={editTags} />
              <JobInput
                url={true} // update query params in url
                changeJobType={changeJobType} // all redux actions
                getParamsList={getParamsList}
                getQueueList={getQueueList}
                jobs={this.props.jobs}
                jobType={this.props.jobType}
                jobLabel={this.props.jobLabel}
              />
              <QueueInput
                queue={this.props.queue}
                queueList={this.props.queueList}
                changeQueue={changeQueue}
              />
              <PriorityInput
                url={true}
                priority={this.props.priority}
                editJobPriority={editJobPriority}
              />
              {divider}
              {hysdsioLabel}
              <JobParams
                url={true} // update query params in url
                editParams={editParams}
                paramsList={paramsList}
                params={params}
              />
              <div className="tosca-on-demand-button-wrapper">
                <div className="tosca-on-demand-button">
                  <Button
                    size="large"
                    label={"Submit"}
                    onClick={this._handleJobSubmit}
                    loading={submitInProgress}
                    disabled={!validSubmission || submitInProgress}
                  />
                </div>
                <div className="tosca-on-demand-button">
                  <Button
                    size="large"
                    color="success"
                    label="Data Count Check"
                    onClick={this._checkQueryDataCount}
                    disabled={!validQuery}
                  />
                </div>
                <div className="tosca-on-demand-button">
                  <Button
                    size="large"
                    color="fail"
                    label="Cancel"
                    onClick={() => window.close()}
                  />
                </div>
                {submissionTypeLabel}
              </div>
            </div>
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
  getOnDemandJobs: () => dispatch(getOnDemandJobs()),
  getQueueList: jobType => dispatch(getQueueList(jobType)),
  getParamsList: jobType => dispatch(getParamsList(jobType)),
  editDataCount: query => dispatch(editDataCount(query))
});

export default connect(mapStateToProps, mapDispatchToProps)(ToscaOnDemand);
