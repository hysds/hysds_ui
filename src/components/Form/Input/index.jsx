import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import "./style.scss";

const InputConnect = (props) => {
  const { label, value, url, editValue, ...rest } = props;

  const _handleChange = (e) => editValue(e.target.value, url);

  return (
    <div className="form-input-wrapper">
      <div className="form-input-label">{label}:</div>
      <input
        onChange={_handleChange}
        value={value}
        className="form-input"
        {...rest}
      />
    </div>
  );
};

InputConnect.propTypes = {
  label: PropTypes.string.isRequired,
  editValue: PropTypes.func.isRequired,
};

InputConnect.defaultProps = {
  label: "Label",
  url: false,
  required: false,
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const { editValue, url } = ownProps;
  return {
    editValue: (value) => dispatch(editValue(value, url)),
  };
};

export default connect(null, mapDispatchToProps)(InputConnect);
