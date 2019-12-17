import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";

import QueryEditor from "../../components/QueryEditor";
import JobInput from "../../components/JobInput";
import JobParams from "../../components/JobParams";
import UserRuleNameInput from "../../components/UserRuleNameInput";
import QueueInput from "../../components/QueueInput";
import PriorityInput from "../../components/PriorityInput";

import { Border } from "../../components/miscellaneous";

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
  }

  componentDidMount() {
    const params = this.props.match.params;
    if (params.rule) {
      this.props.getUserRule(params.rule);
      this.props.getQueueList(params.rule);
    }
    this.props.getOnDemandJobs();
  }

  // TODO: need to not override default job params in user rules editor
  // MAY NEED TO UPDATE JobParams COMPONENT

  render() {
    const divider = this.props.paramsList.length > 0 ? <Border /> : null;

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
            <h1>{this.props.match.params.rule}</h1>
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
