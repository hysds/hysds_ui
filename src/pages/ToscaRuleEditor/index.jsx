import React from "react";
import { Link, Redirect } from "react-router-dom";
import { connect } from "react-redux";

import QueryEditor from "../../components/QueryEditor";
import JobInput from "../../components/JobInput";
import JobParams from "../../components/JobParams";
import UserRuleNameInput from "../../components/UserRuleNameInput";
import QueueInput from "../../components/QueueInput";
import PriorityInput from "../../components/PriorityInput";

import { SubmitButton } from "../../components/Buttons";
import { Border } from "../../components/miscellaneous";

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

import "./style.css";

class ToscaRuleEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      submitInProgress: null,
      submitSuccess: false
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

  // TODO: VALIDATE IF USER RULE IS VALID TO SUBMIT
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

  _handleUserRuleEditSubmit = () => {
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

    const editRuleEndpoint = `${GRQ_REST_API_V1}/grq/user-rules`;
    this.setState({ submitInProgress: "loading" });

    const headers = { "Content-Type": "application/json" };
    fetch(editRuleEndpoint, {
      method: "PUT",
      headers,
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(() =>
        this.setState({ submitInProgress: null, submitSuccess: true })
      );
  };

  render() {
    if (this.state.submitSuccess) return <Redirect to="/tosca/user-rules" />;
    const hysdsioLabel =
      this.props.paramsList.length > 0 ? <h2>{this.props.hysdsio}</h2> : null;

    const divider = this.props.paramsList.length > 0 ? <Border /> : null;
    const validSubmission = this._validateSubmission();

    return (
      <div className="tosca-user-rule-editor">
        <div className="split user-rule-editor-left">
          <QueryEditor
            editQuery={editQuery}
            validateQuery={validateQuery}
            query={this.props.query}
          />
        </div>

        <div className="split user-rule-editor-right">
          <div className="user-rule-editor-right-wrapper">
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
              <SubmitButton
                label="Save Changes"
                onClick={this._handleUserRuleEditSubmit}
                loading={this.state.submitInProgress}
                disabled={!validSubmission}
              />
              <Link
                to="/tosca/user-rules"
                className="user-rules-editor-cancel-button-wrapper"
              >
                <button
                  className="user-rules-editor-cancel-button"
                  onClick={() => this.props.clearJobParams()}
                >
                  Cancel
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// redux state data
const mapStateToProps = state => ({
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
