import React, { Fragment } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import Select from "react-select";

/**
 * generate react-select array objects of queue list:
 * ex. [{value: 0, label: 0}, {value: 1, label: 1}]
 */
const generatePriorityList = n =>
  [...Array(n).keys()].map(num => ({ value: num, label: num }));

class OnDemandJobSubmitter extends React.Component {
  constructor(props) {
    super(props);
    this.priorityList = generatePriorityList(10);
    this.state = {};
  }

  _handleJobChange = e => {
    this.props.changeJobType(e.value);
    this.props.getQueueList(e.value);
  };

  _handleQueueChange = e => this.props.changeQueue(e.value);
  _handleEditPriority = e => this.props.editOnDemandPriority(e.value);

  render() {
    const { jobs, queueList, queue } = this.props;

    return (
      <Fragment>
        <div className="on-demand-tag-wrapper">
          <div className="on-demand-tag-label">Tag:</div>
          <input
            type="text"
            placeholder="Required"
            className="on-demand-tag"
            name="tag"
            // onChange={this._handleTagInput}
          />
        </div>
        <br />

        <section>
          <div className="on-demand-dropdown-label">Jobs:</div>
          <Select
            label="Select Job"
            name="job"
            options={jobs}
            onChange={this._handleJobChange}
            // style={selectStyles}
          />
        </section>
        <br />

        <section>
          <div className="on-demand-dropdown-label">Queue:</div>
          <Select
            label="Queue"
            name="queue"
            options={queueList}
            value={{ label: queue, value: queue }}
            onChange={this._handleQueueChange}
            isDisabled={!(queueList.length > 0)}
            // style={selectStyles}
          />
        </section>
        <br />

        <section>
          <div className="on-demand-dropdown-label">Priority:</div>
          <Select
            label="Priority"
            name="priority"
            options={this.priorityList}
            // value={}
            onChange={this._handleEditPriority}
            // style={selectStyles}
          />
        </section>
      </Fragment>
    );
  }
}

OnDemandJobSubmitter.propTypes = {
  changeJobType: PropTypes.func.isRequired,
  getQueueList: PropTypes.func.isRequired,
  changeQueue: PropTypes.func.isRequired,
  editOnDemandPriority: PropTypes.func.isRequired
};

// Redux actions
const mapDispatchToProps = (dispatch, ownProps) => ({
  changeJobType: jobType => dispatch(ownProps.changeJobType(jobType)),
  editOnDemandPriority: query => dispatch(ownProps.editOnDemandPriority(query)),
  getQueueList: jobType => dispatch(ownProps.getQueueList(jobType)),
  changeQueue: queue => dispatch(ownProps.changeQueue(queue))
});

export default connect(null, mapDispatchToProps)(OnDemandJobSubmitter);
