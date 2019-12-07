import React, { Fragment } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import Select from "react-select";

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

const JobSubmitter = props => {
  const priorityList = generatePriorityList(10);

  const _handleTagInput = e => props.editTags(e.target.value);
  const _handleJobChange = e => {
    const job = e.value;
    props.changeJobType(job);
    props.getQueueList(job);
    props.getParamsList(job);
  };
  const _handleQueueChange = e => props.changeQueue(e.value);
  const _handleEditPriority = e => props.editJobPriority(e.value);

  const { jobType, jobs, queueList, queue, priority, tags } = props;

  return (
    <Fragment>
      <div className="input-wrapper">
        <div className="input-label">Tag:</div>
        <input
          type="text"
          placeholder="Required"
          name="tag"
          onChange={_handleTagInput}
          value={tags || ""}
          className="params-input"
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
            onChange={_handleJobChange}
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
            onChange={_handleQueueChange}
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
            options={priorityList}
            onChange={_handleEditPriority}
            styles={customSelectStyles}
          />
        </div>
      </section>
    </Fragment>
  );
};

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
