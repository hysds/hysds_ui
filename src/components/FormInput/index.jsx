import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import "./style.scss";

const FormInput = (props) => {
  const { label, value, url, editValue, ...newProps } = props;

  const _handleChange = (e) => editValue(e.target.value, url);

  return (
    <div className="form-input-wrapper">
      <div className="form-input-label">{label}:</div>
      <input
        onChange={_handleChange}
        value={value}
        className="form-input"
        {...newProps}
      />
    </div>
  );
};

FormInput.propTypes = {
  label: PropTypes.string.isRequired,
  editValue: PropTypes.func.isRequired,
};

FormInput.defaultProps = {
  label: "Label",
  url: false,
};

// Redux actions
const mapDispatchToProps = (dispatch, ownProps) => {
  const { editValue } = ownProps;
  return {
    editValue: (value, url) => dispatch(editValue(value, url)),
  };
};

export default connect(null, mapDispatchToProps)(FormInput);
