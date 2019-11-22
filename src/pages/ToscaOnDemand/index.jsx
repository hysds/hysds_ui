import React, { Fragment } from "react";

import OnDemandQueryEditor from "../../components/OnDemandQueryEditor/index.jsx";
import OnDemandJobSubmitter from "../../components/OnDemandJobSubmitter/index.jsx";
import { SubmitButton } from "../../components/Buttons/index.jsx";

import { connect } from "react-redux";
import {
  editOnDemandQuery,
  editJobPriority,
  getOnDemandJobs,
  changeJobType,
  getjobParamsList,
  editJobParams,
  getQueueList,
  changeQueue,
  editTags
} from "../../redux/actions";

import "./style.css";

class ToscaOnDemand extends React.Component {
  componentDidMount() {
    this.props.getOnDemandJobs();
  }

  render() {
    let { query, jobParams } = this.props;
    console.log(jobParams);

    return (
      <Fragment>
        <div className="split on-demand-left">
          <OnDemandQueryEditor
            query={query}
            editOnDemandQuery={editOnDemandQuery} // redux action
          />
        </div>

        <div className="split on-demand-right">
          <div className="on-demand-submitter-wrapper">
            <OnDemandJobSubmitter
              changeJobType={changeJobType} // all redux actions
              getjobParamsList={getjobParamsList}
              editJobParams={editJobParams}
              getQueueList={getQueueList}
              changeQueue={changeQueue}
              editJobPriority={editJobPriority}
              editTags={editTags}
              {...this.props}
            />
          </div>
          <SubmitButton />
        </div>
      </Fragment>
    );
  }
}

const mapStateToProps = state => ({
  query: state.toscaReducer.query,
  jobs: state.toscaReducer.jobList,
  jobType: state.toscaReducer.jobType,
  queueList: state.toscaReducer.queueList,
  queue: state.toscaReducer.queue,
  priority: state.toscaReducer.priority,
  jobParamsList: state.toscaReducer.jobParamsList,
  jobParams: state.toscaReducer.jobParams,
  tags: state.toscaReducer.tags
});

const mapDispatchToProps = dispatch => ({
  getOnDemandJobs: () => dispatch(getOnDemandJobs())
});

export default connect(mapStateToProps, mapDispatchToProps)(ToscaOnDemand);
