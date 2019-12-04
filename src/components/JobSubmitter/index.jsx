import React, { Fragment } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import Select from "react-select";

import { Border } from "../miscellaneous";

import "./style.css";

/**
 * generate react-select array objects of queue list:
 * ex. [{value: 0, label: 0}, {value: 1, label: 1}]
 */
const generatePriorityList = n =>
  [...Array(n).keys()].slice(1).map(num => ({ value: num, label: num }));

const customSelectStyles = {
  control: (base, value) => ({
    ...base,
    border: value.hasValue ? null : "2px solid red"
  })
};

class JobSubmitter extends React.Component {
  constructor(props) {
    super(props);
    this.priorityList = generatePriorityList(10);
  }

  _handleTagInput = e => this.props.editTags(e.target.value);
  _handleJobChange = e => {
    const job = e.value;
    this.props.changeJobType(job);
    this.props.getQueueList(job);
    this.props.getParamsList(job);
  };
  _handleQueueChange = e => this.props.changeQueue(e.value);
  _handleEditPriority = e => this.props.editJobPriority(e.value);

  render() {
    const { jobType, jobs, queueList, queue, priority, tags } = this.props;

    return (
      <Fragment>
        <div className="input-wrapper">
          <div className="input-label">Tag:</div>
          <input
            type="text"
            placeholder="Required"
            name="tag"
            onChange={this._handleTagInput}
            value={tags || ""}
            className="on-demand-input"
            required
          />
        </div>

        <section className="dropdown-wrapper">
          <div className="dropdown-label">Jobs:</div>
          <div className="react-select-wrapper">
            <Select
              label="Select Job"
              name="job"
              options={jobs}
              value={{
                label: jobType || "",
                value: jobType || ""
              }}
              onChange={this._handleJobChange}
              styles={customSelectStyles}
            />
          </div>
        </section>

        <section className="dropdown-wrapper">
          <div className="dropdown-label">Queue:</div>
          <div className="react-select-wrapper">
            <Select
              label="Queue"
              name="queue"
              options={queueList}
              value={{ label: queue, value: queue }}
              onChange={this._handleQueueChange}
              isDisabled={!(queueList.length > 0)}
              styles={customSelectStyles}
            />
          </div>
        </section>

        <section className="dropdown-wrapper">
          <div className="dropdown-label">Priority:</div>
          <div className="react-select-wrapper">
            <Select
              label="Priority"
              name="priority"
              value={{
                label: priority || "",
                value: priority || ""
              }}
              options={this.priorityList}
              onChange={this._handleEditPriority}
              styles={customSelectStyles}
            />
          </div>
        </section>
      </Fragment>
    );
  }
}

JobSubmitter.propTypes = {
  changeJobType: PropTypes.func.isRequired,
  getQueueList: PropTypes.func.isRequired,
  changeQueue: PropTypes.func.isRequired,
  editJobPriority: PropTypes.func.isRequired,
  editTags: PropTypes.func.isRequired
};

// Redux actions
const mapDispatchToProps = (dispatch, ownProps) => ({
  changeJobType: jobType => dispatch(ownProps.changeJobType(jobType)),
  getParamsList: jobType => dispatch(ownProps.getParamsList(jobType)),
  getQueueList: jobType => dispatch(ownProps.getQueueList(jobType)),
  changeQueue: queue => dispatch(ownProps.changeQueue(queue)),
  editTags: tag => dispatch(ownProps.editTags(tag)),
  editJobPriority: query => dispatch(ownProps.editJobPriority(query))
});

export default connect(null, mapDispatchToProps)(JobSubmitter);
