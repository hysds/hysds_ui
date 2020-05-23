import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import Select from "react-select";

import "./style.css";

const customSelectStyles = {
  control: (base, value) => ({
    ...base,
    border: value.hasValue ? null : "2px solid red",
  }),
};

const JobParams = (props) => {
  const _handleJobParamInputChange = (e) => {
    let { name, value } = e.target;
    if (value) {
      try {
        value = JSON.parse(value);
      } catch (err) {}
    }
    const payload = {
      name,
      value,
    };
    props.editParams(payload);
  };

  const _handleJobParamDropdownChange = (e, v) => {
    const payload = {
      name: v.name,
      value: e.value,
    };
    props.editParams(payload);
  };

  const _renderParamsList = () => {
    const { params } = props;

    return props.paramsList.map((param) => {
      const paramName = param.name;
      let value = params[paramName];

      try {
        if (value && typeof value === "object") value = JSON.stringify(value);
      } catch (err) {}

      switch (param.type) {
        case "number":
          return (
            <div className="tag-input-wrapper" key={paramName}>
              <label className="tag-input-label">{paramName}:</label>
              <input
                type="number"
                step="1"
                value={value || ""}
                name={paramName}
                onChange={_handleJobParamInputChange}
                className="params-input"
                required={param.optional ? false : true}
              />
            </div>
          );
        case "enum":
          return (
            <section className="params-dropdown-wrapper" key={paramName}>
              <label className="job-params-label">{paramName}:</label>
              <div className="react-select-wrapper">
                <Select
                  label={paramName}
                  value={value ? { label: value, value: value || "" } : null}
                  name={paramName}
                  options={param.enumerables.map((option) => ({
                    label: option,
                    value: option,
                  }))}
                  onChange={_handleJobParamDropdownChange}
                  styles={param.optional ? null : customSelectStyles}
                />
              </div>
            </section>
          );
        case "textarea":
          let className = "params-textarea";
          if (!param.optional && !value) className = `${className} required`;

          return (
            <div className="params-textarea-wrapper" key={paramName}>
              <label className="params-textarea-label">{paramName}:</label>
              <textarea
                className={className}
                name={paramName}
                value={value || ""}
                onChange={_handleJobParamInputChange}
              />
            </div>
          );
        default:
          return (
            <div className="tag-input-wrapper" key={paramName}>
              <div className="tag-input-label">{paramName}:</div>
              <input
                type="text"
                value={value || ""}
                name={paramName}
                placeholder="Required"
                onChange={_handleJobParamInputChange}
                className="params-input"
                required={param.optional ? false : true}
              />
            </div>
          );
      }
    });
  };

  const renderedParamsList = _renderParamsList();
  return renderedParamsList;
};

JobParams.propTypes = {
  editParams: PropTypes.func.isRequired,
};

JobParams.defaultProps = {
  url: false,
};

// Redux actions
const mapDispatchToProps = (dispatch, ownProps) => {
  const { url } = ownProps;
  return {
    editParams: (param) => dispatch(ownProps.editParams(param, url)),
  };
};

export default connect(null, mapDispatchToProps)(JobParams);
