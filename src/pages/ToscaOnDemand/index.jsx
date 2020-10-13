import React, { Fragment } from "react";
import { Helmet } from "react-helmet";

import QueryEditor from "../../components/QueryEditor";
import JobInput from "../../components/JobInput";
import JobParams from "../../components/JobParams";
import { Border, SubmitStatusBar } from "../../components/miscellaneous";

import TagInput from "../../components/TagInput";
import QueueInput from "../../components/QueueInput";
import PriorityInput from "../../components/PriorityInput";
import FormInput from "../../components/FormInput";

import { Button } from "../../components/Buttons";
import HeaderBar from "../../components/HeaderBar";

import { connect } from "react-redux";
import {
  changeJobType,
  changeQueue,
  editJobPriority,
  editParams,
  editQuery,
  editTags,
  editSoftTimeLimit,
  editTimeLimit,
  editDiskUsage,
} from "../../redux/actions";
import {
  getOnDemandJobs,
  getQueueList,
  getParamsList,
  editDataCount,
} from "../../redux/actions/tosca";

import { GRQ_REST_API_V1 } from "../../config";

import "./style.scss";

class ToscaOnDemand extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      submitInProgress: 0,
      submitSuccess: 0,
      submitFailed: 0,
    };
  }

  componentDidMount() {
    const { jobSpec } = this.props;
    this.props.getOnDemandJobs();
    if (jobSpec) {
      this.props.getQueueList(jobSpec);
      this.props.getParamsList(jobSpec);
    }
  }

  _validateSubmission = () => {
    let { jobSpec, tags, queue, priority, params } = this.props;
    const { paramsList } = this.props;

    let validSubmission = true;
    if (!tags || !jobSpec || !priority || !queue) return false;

    paramsList.map((param) => {
      const paramName = param.name;
      if (!(param.optional === true) && !params[paramName])
        validSubmission = false;
    });
    return validSubmission;
  };

  _checkQueryDataCount = () => this.props.editDataCount(this.props.query);

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
      kwargs: JSON.stringify(this.props.params),
    };

    if (this.props.timeLimit) data.time_limit = parseInt(this.props.timeLimit);

    if (this.props.softTimeLimit)
      data.soft_time_limit = parseInt(this.props.softTimeLimit);

    if (this.props.diskUsage) data.disk_usage = this.props.diskUsage;

    const jobSubmitUrl = `${GRQ_REST_API_V1}/grq/on-demand`;
    fetch(jobSubmitUrl, { method: "POST", headers, body: JSON.stringify(data) })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        if (!data.success) {
          this.setState({ submitInProgress: 0, submitFailed: 1 });
          setTimeout(() => this.setState({ submitFailed: 0 }), 3000);
        } else {
          this.setState({ submitInProgress: 0, submitSuccess: 1 });
          setTimeout(() => this.setState({ submitSuccess: 0 }), 3000);
        }
      })
      .catch((err) => {
        console.log(err);
        this.setState({ submitInProgress: 0, submitFailed: 1 });
        setTimeout(() => this.setState({ submitFailed: 0 }), 3000);
      });
  };

  render() {
    const {
      darkMode,
      query,
      paramsList,
      params,
      hysdsio,
      submissionType,
    } = this.props;
    const { submitInProgress, submitSuccess, submitFailed } = this.state;

    const hysdsioLabel = paramsList.length > 0 ? <h2>{hysdsio}</h2> : null;

    const submissionTypeLabel = this.props.jobSpec ? (
      <div className="on-demand-submission-type">
        <p>
          Submit Type: <strong>{submissionType || "iteration"}</strong>
        </p>
      </div>
    ) : null;

    const validSubmission = this._validateSubmission();

    const classTheme = darkMode ? "__theme-dark" : "__theme-light";

    return (
      <div className="tosca-on-demand-page">
        <Helmet>
          <title>Tosca - On Demand</title>
          <meta name="description" content="Helmet application" />
        </Helmet>
        <HeaderBar
          title="HySDS - On Demand"
          theme={classTheme}
          active="tosca"
        />

        <div className={classTheme}>
          <div className="tosca-on-demand">
            <div className="split on-demand-left">
              <QueryEditor
                url={true} // update query params in url
                query={query}
                editQuery={editQuery} // redux action
              />
            </div>

            <div className="split on-demand-right">
              <div className="on-demand-submitter-wrapper">
                <h1>Tosca - On-Demand Job</h1>
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
                    changeJobType={changeJobType} // all redux actions
                    getParamsList={getParamsList}
                    getQueueList={getQueueList}
                    jobs={this.props.jobs}
                    jobSpec={this.props.jobSpec}
                    jobLabel={this.props.jobLabel}
                  />
                </div>
                <div className="on-demand-select-wrapper">
                  <QueueInput
                    queue={this.props.queue}
                    queueList={this.props.queueList}
                    changeQueue={changeQueue}
                  />
                </div>
                <div className="on-demand-select-wrapper">
                  <PriorityInput
                    url={true}
                    priority={this.props.priority}
                    editJobPriority={editJobPriority}
                  />
                </div>
                {paramsList.length > 0 ? <Border /> : null}
                {hysdsioLabel}
                <JobParams
                  url={true} // update query params in url
                  editParams={editParams}
                  paramsList={paramsList}
                  params={params}
                />
                {this.props.jobSpec ? <Border /> : null}
                {this.props.jobSpec ? (
                  <Fragment>
                    <FormInput
                      label="Soft Time Limit"
                      value={this.props.softTimeLimit}
                      editValue={editSoftTimeLimit}
                      type="number"
                      min={1}
                      placeholder="(seconds)"
                    />
                    <FormInput
                      label="Time Limit"
                      value={this.props.timeLimit}
                      editValue={editTimeLimit}
                      type="number"
                      min={1}
                      placeholder="(seconds)"
                    />
                    <FormInput
                      label="Disk Usage"
                      value={this.props.diskUsage}
                      editValue={editDiskUsage}
                      placeholder="(KB, MB, GB)"
                    />
                  </Fragment>
                ) : null}
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
        </div>
        <SubmitStatusBar label="Job Submitted!" visible={submitSuccess} />
        <SubmitStatusBar
          label="Job Submission Failed"
          visible={submitFailed}
          status="failed"
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  darkMode: state.themeReducer.darkMode,
  query: state.generalReducer.query,
  jobs: state.generalReducer.jobList,
  jobSpec: state.generalReducer.jobSpec,
  jobLabel: state.generalReducer.jobLabel,
  hysdsio: state.generalReducer.hysdsio,
  queueList: state.generalReducer.queueList,
  queue: state.generalReducer.queue,
  priority: state.generalReducer.priority,
  paramsList: state.generalReducer.paramsList,
  params: state.generalReducer.params,
  tags: state.generalReducer.tags,
  softTimeLimit: state.generalReducer.softTimeLimit,
  timeLimit: state.generalReducer.timeLimit,
  diskUsage: state.generalReducer.diskUsage,
  submissionType: state.generalReducer.submissionType,
  dataCount: state.generalReducer.dataCount,
});

const mapDispatchToProps = (dispatch) => ({
  getOnDemandJobs: () => dispatch(getOnDemandJobs()),
  getQueueList: (jobSpec) => dispatch(getQueueList(jobSpec)),
  getParamsList: (jobSpec) => dispatch(getParamsList(jobSpec)),
  editDataCount: (query) => dispatch(editDataCount(query)),
});

export default connect(mapStateToProps, mapDispatchToProps)(ToscaOnDemand);
