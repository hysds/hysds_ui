import React, { Fragment } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import Select from "react-select";

import "./style.css";

const JobInput = props => {
  const customSelectStyles = {
    control: (base, value) => ({
      ...base,
      border: value.hasValue ? null : "2px solid red"
    })
  };

  const _handleJobChange = e => {
    const job = e.value;
    props.changeJobType(job);
    props.getQueueList(job);
    props.getParamsList(job);
  };

  const { jobType, jobs } = props;

  return (
    <Fragment>
      <section className="job-input-wrapper">
        <div className="job-input-label">Jobs:</div>
        <div className="job-input-select-wrapper">
          <Select
            label="Select Job"
            name="job"
            options={jobs}
            value={{
              label: "" || jobType,
              value: "" || jobType
            }}
            onChange={_handleJobChange}
            styles={customSelectStyles}
          />
        </div>
      </section>
    </Fragment>
  );
};

JobInput.propTypes = {
  changeJobType: PropTypes.func.isRequired,
  getQueueList: PropTypes.func.isRequired
};

JobInput.defaultProps = {
  url: false
};

// Redux actions
const mapDispatchToProps = (dispatch, ownProps) => {
  const { changeJobType, getParamsList, getQueueList, url } = ownProps;
  return {
    changeJobType: jobType => dispatch(changeJobType(jobType, url)),
    getParamsList: jobType => dispatch(getParamsList(jobType)),
    getQueueList: jobType => dispatch(getQueueList(jobType))
  };
};

export default connect(null, mapDispatchToProps)(JobInput);
