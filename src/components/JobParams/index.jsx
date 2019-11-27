import React, { Fragment } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import Select from "react-select";

import { Border } from "../miscellaneous/index.jsx";

import "./style.css";

const customSelectStyles = {
  control: (base, value) => ({
    ...base,
    border: value.hasValue ? null : "2px solid red"
  })
};

class JobParams extends React.Component {
  constructor(props) {
    super(props);
  }

  _handleJobParamInputChange = e => {
    const payload = {
      name: e.target.name,
      value: e.target.value
    };
    this.props.editParams(payload);
  };

  _handleJobParamDropdownChange = (e, v) => {
    const payload = {
      name: v.name,
      value: e.value
    };
    this.props.editParams(payload);
  };

  _renderParamsList = () => {
    const { params } = this.props;

    return this.props.paramsList.map(param => {
      const paramName = param.name;
      const value = params[paramName];

      switch (param.type) {
        case "number":
          return (
            <div className="input-wrapper" key={paramName}>
              <div className="input-label">{paramName}:</div>
              <input
                type="number"
                step="1"
                value={value || ""}
                name={paramName}
                onChange={this._handleJobParamInputChange}
                className="on-demand-input"
                required={param.optional ? false : true}
              />
            </div>
          );
        case "enum":
          return (
            <section className="dropdown-wrapper" key={paramName}>
              <div className="dropdown-label">{paramName}:</div>
              <div className="react-select-wrapper">
                <Select
                  label={paramName}
                  value={value ? { label: value, value: value || "" } : null}
                  name={paramName}
                  options={param.enumerables.map(option => ({
                    label: option,
                    value: option
                  }))}
                  onChange={this._handleJobParamDropdownChange}
                  styles={param.optional ? null : customSelectStyles}
                />
              </div>
            </section>
          );
        case "textarea":
          return (
            <div className="on-demand-textarea-wrapper" key={paramName}>
              <label className="on-demand-textarea-label">{paramName}:</label>
              <textarea
                className="on-demand-textarea"
                name={paramName}
                value={value || ""}
                onChange={this._handleJobParamInputChange}
                required={param.optional ? false : true}
              ></textarea>
            </div>
          );
        default:
          return (
            <div className="input-wrapper" key={paramName}>
              <div className="input-label">{paramName}:</div>
              <input
                type="text"
                value={value || ""}
                name={paramName}
                placeholder="Required"
                onChange={this._handleJobParamInputChange}
                className="on-demand-input"
                required={param.optional ? false : true}
              />
            </div>
          );
      }
    });
  };

  render() {
    const { paramsList, hysdsio } = this.props;

    const renderedParamsList = this._renderParamsList();
    const divider = paramsList.length > 0 ? <Border /> : null;

    return (
      <Fragment>
        {divider}
        <h2>{hysdsio}</h2>
        {renderedParamsList}
      </Fragment>
    );
  }
}

JobParams.propTypes = {
  editParams: PropTypes.func.isRequired
};

// Redux actions
const mapDispatchToProps = (dispatch, ownProps) => ({
  editParams: param => dispatch(ownProps.editParams(param))
});

export default connect(null, mapDispatchToProps)(JobParams);
