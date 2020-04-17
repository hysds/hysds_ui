import React, { Fragment } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import Select from "react-select";

import "./style.css";

const JobInput = (props) => {
  const customSelectStyles = {
    control: (base, value) => ({
      ...base,
      border: value.hasValue ? null : "2px solid red",
    }),
  };

  const _handleJobChange = (e) => {
    if (e.jobSpec === props.jobSpec) return;
    props.changeJobType(e, props.url);
    props.getQueueList(e.jobSpec);
    props.getParamsList(e.jobSpec);
  };

  const { jobSpec, jobLabel, jobs } = props;

  return (
    <Fragment>
      <section className="job-input-wrapper">
        <label className="job-input-label">Jobs:</label>
        <div className="job-input-select-wrapper">
          <Select
            label="Select Job"
            name="job"
            options={jobs}
            value={{
              label: jobLabel || jobSpec || "",
              value: jobSpec || "",
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
  getQueueList: PropTypes.func.isRequired,
};

JobInput.defaultProps = {
  url: false,
};

// Redux actions
const mapDispatchToProps = (dispatch, ownProps) => {
  const { changeJobType, getParamsList, getQueueList, url } = ownProps;
  return {
    changeJobType: (jobSpec, hysdsio) =>
      dispatch(changeJobType(jobSpec, hysdsio, url)),
    getParamsList: (jobSpec) => dispatch(getParamsList(jobSpec)),
    getQueueList: (jobSpec) => dispatch(getQueueList(jobSpec)),
  };
};

export default connect(null, mapDispatchToProps)(JobInput);
