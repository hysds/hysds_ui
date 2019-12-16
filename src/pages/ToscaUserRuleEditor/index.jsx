import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import QueryEditor from "../../components/QueryEditor";
import JobInput from "../../components/JobInput";
import JobParams from "../../components/JobParams";

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
  editTags
} from "../../redux/actions";

import "./style.css";

class ToscaUserRuleEditor extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const params = this.props.match.params;
    if (params.rule) this.props.getUserRule(params.rule);
    this.props.getOnDemandJobs();
  }

  render() {
    console.log(this.props);
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
            <JobInput
              changeJobType={changeJobType} // all redux actions
              getParamsList={getParamsList}
              editParams={editParams}
              getQueueList={getQueueList}
              changeQueue={changeQueue}
              editJobPriority={editJobPriority}
              editTags={editTags}
              query={this.props.query} // data
              validQuery={this.props.validQuery}
              jobs={this.props.jobs}
              jobType={this.props.jobType}
              hysdsio={this.props.hysdsio}
              queueList={this.props.queueList}
              queue={this.props.queue}
              priority={this.props.priority}
              paramsList={this.props.paramsList}
              params={this.props.params}
              tags={this.props.tags}
              submissionType={this.props.submissionType}
            />
            {divider}
            <JobParams
              editParams={editParams}
              paramsList={this.props.paramsList}
              params={this.props.params}
            />

            <Link to="/tosca/user-rules">
              <button className="user-rules-editor-cancel-button">
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

// Redux actions
const mapDispatchToProps = (dispatch, ownProps) => ({
  getUserRule: id => dispatch(getUserRule(id)),
  getOnDemandJobs: () => dispatch(getOnDemandJobs())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ToscaUserRuleEditor);
