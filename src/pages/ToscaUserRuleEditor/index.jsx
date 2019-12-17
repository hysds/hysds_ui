import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";

import QueryEditor from "../../components/QueryEditor";
import JobInput from "../../components/JobInput";
import JobParams from "../../components/JobParams";
import UserRuleNameInput from "../../components/UserRuleNameInput";
import QueueInput from "../../components/QueueInput";
import PriorityInput from "../../components/PriorityInput";

import { SubmitButton } from "../../components/Buttons";
import { Border } from "../../components/miscellaneous";

import { Redirect } from "react-router-dom";

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

class ToscaUserRuleEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      submitInProgress: false,
      submitSuccess: false
    };
  }

  // TODO: VALIDATE IF USER RULE IS VALID TO SUBMIT

  componentDidMount() {
    const params = this.props.match.params;
    if (params.rule) {
      this.props.getUserRule(params.rule);
      this.props.getQueueList(params.rule);
    }
    this.props.getOnDemandJobs();
  }

  _handleUserRuleEditSubmit = () => {
    const ruleId = this.props.match.params.rule;
    const editUserRulesEndpoint = `${GRQ_REST_API_V1}/grq/user-rules`;

    const headers = { "Content-Type": "application/json" };
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
    console.log(data);

    this.setState({ submitInProgress: true });

    fetch(editUserRulesEndpoint, {
      method: "PUT",
      headers,
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(data => {
        console.log(data);
        this.setState({
          submitInProgress: false,
          submitSuccess: true
        });
      });
  };

  render() {
    const divider = this.props.paramsList.length > 0 ? <Border /> : null;

    if (this.state.submitSuccess) return <Redirect to="/tosca/user-rules" />;

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
            <JobParams
              editParams={editParams}
              paramsList={this.props.paramsList}
              params={this.props.params}
            />

            <SubmitButton
              label="Save Changes"
              onClick={this._handleUserRuleEditSubmit}
              loading={this.state.submitInProgress}
            />
            <Link to="/tosca/user-rules">
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
  ruleName: state.toscaReducer.ruleName,
  submissionType: state.toscaReducer.submissionType,
  dataCount: state.toscaReducer.dataCount
});

// Redux actions
const mapDispatchToProps = (dispatch, ownProps) => ({
  getUserRule: id => dispatch(getUserRule(id)),
  getOnDemandJobs: () => dispatch(getOnDemandJobs()),
  clearJobParams: () => dispatch(clearJobParams()),
  getQueueList: jobType => dispatch(getQueueList(jobType))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ToscaUserRuleEditor);
