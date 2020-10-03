import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import "./style.scss";

const TimeLimit = (props) => {
  const { label, time } = props;

  const _handleChange = (e) => {
    console.log(e.target.value);
    props.editTimeLimit(e.target.value, true);
  };

  return (
    <div className="time-limit-input-wrapper">
      <div className="time-limit-input-label">{label}:</div>
      <input
        type="number"
        onChange={_handleChange}
        value={time}
        className="time-limit-input"
        min={0}
        placeholder="(seconds)"
      />
    </div>
  );
};

TimeLimit.PropTypes = {
  label: PropTypes.string.isRequired,
  editTimeLimit: PropTypes.func.isRequired,
};

TimeLimit.defaultProps = {
  label: "Time Limit",
  url: false,
};

// Redux actions
const mapDispatchToProps = (dispatch, ownProps) => {
  const { editTimeLimit, url } = ownProps;
  return {
    editTimeLimit: (time) => dispatch(editTimeLimit(time, url)),
  };
};

export default connect(null, mapDispatchToProps)(TimeLimit);
