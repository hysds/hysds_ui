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
    console.log(e);
    props.changeJobType(e, props.url);
    props.getQueueList(e.jobType);
    props.getParamsList(e.jobType);
  };

  const { jobType, jobLabel, jobs } = props;

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
              label: jobLabel || jobType || "",
              value: jobType || ""
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
    changeJobType: (jobType, hysdsio) =>
      dispatch(changeJobType(jobType, hysdsio, url)),
    getParamsList: jobType => dispatch(getParamsList(jobType)),
    getQueueList: jobType => dispatch(getQueueList(jobType))
  };
};

export default connect(null, mapDispatchToProps)(JobInput);
