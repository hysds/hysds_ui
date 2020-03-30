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

import { MOZART_REST_API_V1 } from "../../config/figaro";

import {
  validateQuery,
  editQuery,
  editJobPriority,
  changeJobType,
  editParams,
  changeQueue,
  editRuleName,
  clearJobParams
} from "../../redux/actions";
import {
  getUserRule,
  getOnDemandJobs,
  getParamsList,
  getQueueList
} from "../../redux/actions/figaro";

import "./style.scss";

class FigaroRuleEditor extends React.Component {
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
      jobSpec,
      ruleName,
      queue,
      priority,
      params,
      paramsList
    } = this.props;

    let validSubmission = true;
    if (!validQuery || !ruleName || !jobSpec || !priority || !queue)
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
      job_spec: this.props.jobSpec,
      queue: this.props.queue,
      kwargs: JSON.stringify(this.props.params)
    };

    this.setState({
      submitInProgress: "loading"
    });

    const endpoint = `${MOZART_REST_API_V1}/user-rules`;
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
    if (this.state.submitSuccess) return <Redirect to="/figaro/user-rules" />;

    const hysdsioLabel =
      this.props.paramsList.length > 0 ? <h2>{this.props.hysdsio}</h2> : null;
    const divider = this.props.paramsList.length > 0 ? <Border /> : null;
    const validSubmission = this._validateSubmission();

    const classTheme = darkMode ? "__theme-dark" : "__theme-light";
    const darkTheme = "twilight";
    const lightTheme = "tomorrow";
    const aceTheme = darkMode ? darkTheme : lightTheme;

    return (
      <div className="figaro-user-rule-editor-page">
        <Helmet>
          <title>Mozart - Rule Editor</title>
          <meta name="description" content="Helmet application" />
        </Helmet>
        <HeaderBar
          title="HySDS - User Rules"
          theme={classTheme}
          active="figaro"
        />

        <div className="figaro-user-rule-editor">
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
              <h1>Mozart - User Rule Editor</h1>
              <UserRuleNameInput
                editRuleName={editRuleName}
                ruleName={this.props.ruleName}
              />
              <JobInput
                changeJobType={changeJobType} // all redux actions
                getParamsList={getParamsList}
                getQueueList={getQueueList}
                jobs={this.props.jobs}
                jobSpec={this.props.jobSpec}
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
                    href="/figaro/user-rules"
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
  userRules: state.generalReducer.userRules,
  query: state.generalReducer.query,
  validQuery: state.generalReducer.validQuery,
  jobs: state.generalReducer.jobList,
  jobSpec: state.generalReducer.jobSpec,
  jobLabel: state.generalReducer.jobLabel,
  hysdsio: state.generalReducer.hysdsio,
  queueList: state.generalReducer.queueList,
  queue: state.generalReducer.queue,
  priority: state.generalReducer.priority,
  paramsList: state.generalReducer.paramsList,
  params: state.generalReducer.params,
  ruleName: state.generalReducer.ruleName
});

// Redux actions
const mapDispatchToProps = dispatch => ({
  getUserRule: id => dispatch(getUserRule(id)),
  getOnDemandJobs: () => dispatch(getOnDemandJobs()),
  clearJobParams: () => dispatch(clearJobParams()),
  getQueueList: jobSpec => dispatch(getQueueList(jobSpec))
});

export default connect(mapStateToProps, mapDispatchToProps)(FigaroRuleEditor);
