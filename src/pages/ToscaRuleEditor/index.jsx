import React, { Fragment } from "react";
import { Helmet } from "react-helmet";

import { Link, Redirect } from "react-router-dom";
import { connect } from "react-redux";

import QueryEditor from "../../components/QueryEditor";
import JobInput from "../../components/JobInput";
import JobParams from "../../components/JobParams";
import UserRuleNameInput from "../../components/UserRuleNameInput";
import QueueInput from "../../components/QueueInput";
import PriorityInput from "../../components/PriorityInput";

import { Button, ButtonLink } from "../../components/Buttons";
import { Border, SubmitStatusBar } from "../../components/miscellaneous";

import HeaderBar from "../../components/HeaderBar";

import { GRQ_REST_API_V1 } from "../../config";

import {
  getUserRule,
  validateQuery,
  editQuery,
  editJobPriority,
  getOnDemandJobs,
  changeJobType,
  getParamsList,
  editParams,
  getQueueList,
  changeQueue,
  editRuleName,
  clearJobParams
} from "../../redux/actions";

import "./style.scss";

class ToscaRuleEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      submitInProgress: 0,
      submitSuccess: 0,
      submitFailed: 0,
      failureReason: "",
      editMode: props.match.params.rule ? true : false // using the same component for creating new rules and editing existing rules
    };
  }

  componentDidMount() {
    const params = this.props.match.params;
    if (params.rule) {
      this.props.getUserRule(params.rule);
      this.props.getQueueList(params.rule);
    }
    this.props.getOnDemandJobs();
  }

  _validateSubmission = () => {
    let {
      validQuery,
      jobType,
      ruleName,
      queue,
      priority,
      params,
      paramsList
    } = this.props;

    let validSubmission = true;
    if (!validQuery || !ruleName || !jobType || !priority || !queue)
      return false;

    paramsList.map(param => {
      const paramName = param.name;
      if (!(param.optional === true) && !params[paramName])
        validSubmission = false;
    });
    return validSubmission;
  };

  _handleUserRuleSubmit = () => {
    const ruleId = this.props.match.params.rule;
    const data = {
      id: ruleId,
      rule_name: this.props.ruleName,
      query_string: this.props.query,
      priority: this.props.priority,
      workflow: this.props.hysdsio,
      job_spec: this.props.jobType,
      queue: this.props.queue,
      kwargs: JSON.stringify(this.props.params)
    };

    this.setState({
      submitInProgress: "loading"
    });

    const endpoint = `${GRQ_REST_API_V1}/grq/user-rules`;
    const headers = { "Content-Type": "application/json" };
    const method = this.state.editMode ? "PUT" : "POST";
    fetch(endpoint, {
      headers,
      method,
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          this.setState({
            submitInProgress: 0,
            submitFailed: 1,
            failureReason: data.message
          });
          setTimeout(() => this.setState({ submitFailed: 0 }), 3000);
        } else {
          this.props.clearJobParams();
          this.setState({
            submitInProgress: 0,
            submitSuccess: 1,
            failureReason: ""
          });
        }
      })
      .catch(err => {
        console.error(err);
        this.setState({ submitInProgress: 0, submitFailed: 1 });
        setTimeout(() => this.setState({ submitFailed: 0 }), 3000);
      });
  };

  render() {
    const { darkMode } = this.props;
    if (this.state.submitSuccess) return <Redirect to="/tosca/user-rules" />;

    const hysdsioLabel =
      this.props.paramsList.length > 0 ? <h2>{this.props.hysdsio}</h2> : null;
    const divider = this.props.paramsList.length > 0 ? <Border /> : null;
    const validSubmission = this._validateSubmission();

    const classTheme = darkMode ? "__dark-theme" : "__light-theme";
    const darkTheme = "twilight";
    const lightTheme = "tomorrow";
    const aceTheme = darkMode ? darkTheme : lightTheme;

    return (
      <div className={classTheme}>
        <Helmet>
          <title>Tosca - Rule Editor</title>
          <meta name="description" content="Helmet application" />
        </Helmet>
        <HeaderBar title="HySDS - User Rules" />

        <div className="tosca-user-rule-editor">
          <div className="split user-rule-editor-left">
            <QueryEditor
              url={!this.state.editMode}
              editQuery={editQuery}
              validateQuery={validateQuery}
              query={this.props.query}
              theme={aceTheme}
            />
          </div>

          <div className="split user-rule-editor-right">
            <div className="user-rule-editor-right-wrapper">
              <h1>Tosca - User Rule Editor</h1>
              <UserRuleNameInput
                editRuleName={editRuleName}
                ruleName={this.props.ruleName}
              />
              <JobInput
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
                priority={this.props.priority}
                editJobPriority={editJobPriority}
              />
              {divider}
              {hysdsioLabel}
              <JobParams
                editParams={editParams}
                paramsList={this.props.paramsList}
                params={this.props.params}
              />

              <div className="user-rule-buttons-wrapper">
                <div className="user-rule-button">
                  <Button
                    size="large"
                    label={this.state.editMode ? "Save Changes" : "Save"}
                    onClick={this._handleUserRuleSubmit}
                    loading={this.state.submitInProgress}
                    disabled={!validSubmission}
                  />
                </div>
                <div className="user-rule-button">
                  <ButtonLink
                    color="fail"
                    label="Cancel"
                    size="large"
                    href="/tosca/user-rules"
                    onClick={() => this.props.clearJobParams()}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <SubmitStatusBar
          label="User Rule Submission Failed"
          reason={this.state.failureReason}
          visible={this.state.submitFailed}
          status="failed"
        />
      </div>
    );
  }
}

// redux state data
const mapStateToProps = state => ({
  darkMode: state.themeReducer.darkMode,
  userRules: state.toscaReducer.userRules,
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
  ruleName: state.toscaReducer.ruleName
});

// Redux actions
const mapDispatchToProps = dispatch => ({
  getUserRule: id => dispatch(getUserRule(id)),
  getOnDemandJobs: () => dispatch(getOnDemandJobs()),
  clearJobParams: () => dispatch(clearJobParams()),
  getQueueList: jobType => dispatch(getQueueList(jobType))
});

export default connect(mapStateToProps, mapDispatchToProps)(ToscaRuleEditor);
