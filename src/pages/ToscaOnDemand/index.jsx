import React, { Fragment } from "react";

import OnDemandQueryEditor from "../../components/OnDemandQueryEditor/index.jsx";
import OnDemandJobSubmitter from "../../components/OnDemandJobSubmitter/index.jsx";

import { connect } from "react-redux";
import {
  editOnDemandQuery,
  editOnDemandPriority,
  getOnDemandJobs,
  changeJobType,
  getQueueList,
  changeQueue
} from "../../redux/actions";

import "./style.css";

class ToscaOnDemand extends React.Component {
  componentDidMount() {
    this.props.getOnDemandJobs();
  }

  render() {
    let { query, jobs, queueList, queue } = this.props;

    return (
      <Fragment>
        <div className="split on-demand-left">
          <OnDemandQueryEditor
            query={query}
            editOnDemandQuery={editOnDemandQuery} // redux action
          />
        </div>

        <div className="split on-demand-right">
          <div className="on-demand-subitter-wrapper">
            <OnDemandJobSubmitter
              changeJobType={changeJobType}
              getQueueList={getQueueList}
              changeQueue={changeQueue}
              editOnDemandPriority={editOnDemandPriority}
              jobs={jobs}
              queueList={queueList}
              queue={queue}
            />
          </div>
        </div>
      </Fragment>
    );
  }
}

const mapStateToProps = state => ({
  query: state.toscaReducer.onDemandQuery,
  jobs: state.toscaReducer.jobList,
  jobType: state.toscaReducer.jobType,
  queueList: state.toscaReducer.queueList,
  queue: state.toscaReducer.queue,
  priority: state.toscaReducer.priority
});

const mapDispatchToProps = dispatch => ({
  getOnDemandJobs: () => dispatch(getOnDemandJobs())
});

export default connect(mapStateToProps, mapDispatchToProps)(ToscaOnDemand);
