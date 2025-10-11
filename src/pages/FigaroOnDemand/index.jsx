import React from "react";
import { Helmet } from "react-helmet";

import QueryEditor from "../../components/QueryEditor";
import JobInput from "../../components/JobInput";
import Params from "../../components/Form/Params";
import { Border, SubmitStatusBar } from "../../components/miscellaneous";

import Input from "../../components/Form/Input";
import Dropdown from "../../components/Form/Dropdown";

import { Button } from "../../components/Buttons";
import HeaderBar from "../../components/HeaderBar";
import ConfirmationModal from "../../components/ConfirmationModal";

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
  editDedup,
} from "../../redux/actions";
import {
  getOnDemandJobs,
  getQueueList,
  getParamsList,
  editDataCount,
} from "../../redux/actions/figaro";

import { buildParams, validateSubmission } from "../../utils";
import { MOZART_REST_API_V1 } from "../../config";

import "./style.css";

class FigaroOnDemand extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      submitInProgress: 0,
      submitSuccess: 0,
      submitFailed: 0,
      failureReason: "",
      showConfirmationModal: false,
      dataCountLoading: false,
      queryModified: false,
      lastValidatedQuery: props.query || "",
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

  componentDidUpdate(prevProps) {
    // Track query changes to determine if validation is needed
    if (prevProps.query !== this.props.query) {
      this.setState({
        queryModified: this.props.query !== this.state.lastValidatedQuery,
      });
    }
  }

  checkQueryDataCount = () => {
    if (!this.props.query || this.props.query.trim() === '') {
      console.warn('Data Count Check: Query is empty or undefined');
      return;
    }
    
    try {
      // Validate that the query is valid JSON
      JSON.parse(this.props.query);
      this.setState({ dataCountLoading: true });
      
      // Create a promise to track when the action completes
      const dataCountPromise = this.props.editDataCount(this.props.query);
      
      // Reset loading state when the promise resolves
      if (dataCountPromise && typeof dataCountPromise.then === 'function') {
        dataCountPromise.then(() => {
          // Mark query as validated on successful data count check
          this.setState({ 
            dataCountLoading: false,
            queryModified: false,
            lastValidatedQuery: this.props.query,
          });
        }).catch(() => {
          this.setState({ dataCountLoading: false });
        });
      } else {
        // Fallback timeout if the action doesn't return a promise
        setTimeout(() => {
          this.setState({ dataCountLoading: false });
        }, 5000);
      }
    } catch (error) {
      console.error('Data Count Check: Invalid JSON query:', error);
      this.setState({ dataCountLoading: false });
    }
  };

  handleSubmitClick = () => {
    this.setState({ showConfirmationModal: true });
  };

  handleConfirmSubmit = () => {
    this.setState({ showConfirmationModal: false });
    this.handleJobSubmit();
  };

  handleCancelSubmit = () => {
    this.setState({ showConfirmationModal: false });
  };

  getConfirmationMessage = () => {
    const { hysdsio, submissionType, dataCount } = this.props;
    const jobName = hysdsio || 'job';
    
    // Default to iteration mode if submissionType is null (matching UI behavior)
    const actualSubmissionType = submissionType || 'iteration';
    
    if (actualSubmissionType === 'iteration') {
      return `Are you sure you want to submit ${dataCount} ${jobName} jobs? This will submit one job for each of the ${dataCount} records found. This action cannot be undone.`;
    } else {
      return `Are you sure you want to submit an individual ${jobName} job for the ${dataCount} results? This action cannot be undone.`;
    }
  };

  isFormSubmissionDisabled = () => {
    const { queryModified } = this.state;
    const { dataCount } = this.props;
    
    // Disable if query has been modified since last validation
    if (queryModified) {
      return true;
    }
    
    // Disable if no data count or data count is 0
    if (!dataCount || dataCount === 0) {
      return true;
    }
    
    return false;
  };

  getValidationMessage = () => {
    const { queryModified } = this.state;
    const { dataCount } = this.props;
    
    if (queryModified) {
      return "Query has been modified. Please click 'Data Count Check' to validate the search results.";
    }
    
    if (!dataCount || dataCount === 0) {
      return "No results found for the current query. Please modify your query and try again.";
    }
    
    return null;
  };

  handleJobSubmit = () => {
    let { paramsList, params } = this.props;

    let newParams = {};
    try {
      newParams = buildParams(paramsList, params);
    } catch (err) {
      this.setState({
        submitInProgress: 0,
        submitFailed: 1,
        failureReason: err,
      });
      setTimeout(() => this.setState({ submitFailed: 0 }), 3000);
      return;
    }

    const data = {
      tags: this.props.tags,
      job_type: this.props.hysdsio,
      hysds_io: this.props.hysdsio,
      queue: this.props.queue,
      priority: this.props.priority,
      query: this.props.query,
      kwargs: JSON.stringify(newParams),
      enable_dedup: this.props.dedup,
    };

    if (this.props.timeLimit) data.time_limit = parseInt(this.props.timeLimit);

    if (this.props.softTimeLimit)
      data.soft_time_limit = parseInt(this.props.softTimeLimit);

    if (this.props.diskUsage) data.disk_usage = this.props.diskUsage;

    const headers = { "Content-Type": "application/json" };
    const jobSubmitUrl = `${MOZART_REST_API_V1}/on-demand`;

    this.setState({ submitInProgress: 1 });
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
        console.error(err);
        this.setState({ submitInProgress: 0, submitFailed: 1 });
        setTimeout(() => this.setState({ submitFailed: 0 }), 3000);
      });
  };

  render() {
    const { darkMode, query, paramsList, params, hysdsio, submissionType } =
      this.props;
    const { submitInProgress, submitSuccess, submitFailed, showConfirmationModal, dataCountLoading } = this.state;

    const hysdsioLabel = paramsList.length > 0 ? <h2>{hysdsio}</h2> : null;

    const submissionTypeLabel = this.props.jobSpec ? (
      <div className="on-demand-submission-type">
        <p>
          Submit Type: <strong>{submissionType || "iteration"}</strong>
        </p>
      </div>
    ) : null;

    const validSubmission = validateSubmission(this.props);
    const isFormDisabled = this.isFormSubmissionDisabled();
    const validationMessage = this.getValidationMessage();

    const classTheme = darkMode ? "__theme-dark" : "__theme-light";

    return (
      <div className="figaro-on-demand-page">
        <Helmet>
          <title>Figaro - On Demand</title>
          <meta name="description" content="Helmet application" />
        </Helmet>
        <HeaderBar title="HySDS - On Demand" theme={classTheme} />

        <div className={classTheme}>
          <div className="figaro-on-demand">
            <div className="split on-demand-left">
              <QueryEditor url={true} query={query} editQuery={editQuery} />
            </div>

            <div className="split on-demand-right">
              <div className="on-demand-submitter-wrapper">
                <h1>Figaro - On-Demand Job</h1>
                <div className="data-count-header">
                  Total Records: {this.props.dataCount || "N/A"}
                </div>
                {validationMessage && (
                  <div className="validation-message">
                    <p>{validationMessage}</p>
                  </div>
                )}

                <Input
                  label="Tag"
                  value={this.props.tags}
                  editValue={editTags}
                  placeholder="Required"
                  url={true}
                  required
                />
                <div className="on-demand-select-wrapper">
                  <JobInput
                    url={true}
                    changeJobType={changeJobType} // all redux actions
                    getParamsList={getParamsList}
                    getQueueList={getQueueList}
                    jobs={this.props.jobs}
                    jobSpec={this.props.jobSpec}
                    jobLabel={this.props.jobLabel}
                  />
                </div>
                <div className="on-demand-select-wrapper">
                  <Dropdown
                    label="Queue"
                    value={this.props.queue}
                    options={this.props.queueList}
                    editValue={changeQueue}
                    required
                  />
                </div>
                <div className="on-demand-select-wrapper">
                  <Dropdown
                    label="Priority"
                    url={true}
                    value={this.props.priority}
                    options={this.props.priorityList}
                    editValue={editJobPriority}
                  />
                </div>
                {paramsList.length > 0 ? <Border /> : null}
                {hysdsioLabel}
                <Params
                  url={true}
                  editParams={editParams}
                  paramsList={paramsList}
                  params={params}
                />
                {this.props.jobSpec ? (
                  <>
                    <Border />
                    <Input
                      label="Soft Time Limit"
                      value={this.props.softTimeLimit}
                      editValue={editSoftTimeLimit}
                      type="number"
                      min={1}
                      placeholder="(seconds)"
                    />
                    <Input
                      label="Time Limit"
                      value={this.props.timeLimit}
                      editValue={editTimeLimit}
                      type="number"
                      min={1}
                      placeholder="(seconds)"
                    />
                    <Input
                      label="Disk Usage"
                      value={this.props.diskUsage}
                      editValue={editDiskUsage}
                      placeholder="(KB, MB, GB)"
                    />
                    <Dropdown
                      label="Enable Dedup"
                      value={this.props.dedup}
                      editValue={editDedup}
                      options={[
                        { value: true, label: "true" },
                        { value: false, label: "false" },
                      ]}
                    />
                  </>
                ) : null}

                <div className="tosca-on-demand-button-wrapper">
                  <div className="tosca-on-demand-button">
                    <Button
                      size="large"
                      label={"Submit"}
                      onClick={this.handleSubmitClick}
                      loading={submitInProgress}
                      disabled={!validSubmission || submitInProgress || isFormDisabled}
                    />
                  </div>
                  <div className="tosca-on-demand-button">
                    <Button
                      size="large"
                      color="success"
                      label="Data Count Check"
                      onClick={this.checkQueryDataCount}
                      loading={dataCountLoading}
                      disabled={dataCountLoading}
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
          reason={this.state.failureReason}
        />
        <ConfirmationModal
          isOpen={showConfirmationModal}
          onClose={this.handleCancelSubmit}
          onConfirm={this.handleConfirmSubmit}
          title="Confirm Job Submission"
          message={this.getConfirmationMessage()}
          confirmText="Submit Job"
          cancelText="Cancel"
          confirmColor="success"
          loading={submitInProgress}
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
  priorityList: state.generalReducer.priorityList,
  paramsList: state.generalReducer.paramsList,
  params: state.generalReducer.params,
  tags: state.generalReducer.tags,
  submissionType: state.generalReducer.submissionType,
  softTimeLimit: state.generalReducer.softTimeLimit,
  timeLimit: state.generalReducer.timeLimit,
  diskUsage: state.generalReducer.diskUsage,
  dataCount: state.generalReducer.dataCount,
  dedup: state.generalReducer.dedup,
});

const mapDispatchToProps = (dispatch) => ({
  getOnDemandJobs: () => dispatch(getOnDemandJobs()),
  getQueueList: (jobSpec) => dispatch(getQueueList(jobSpec)),
  getParamsList: (jobSpec) => dispatch(getParamsList(jobSpec)),
  editDataCount: (query) => dispatch(editDataCount(query)),
});

export default connect(mapStateToProps, mapDispatchToProps)(FigaroOnDemand);
