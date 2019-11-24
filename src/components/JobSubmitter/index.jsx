import React, { Fragment } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import Select from "react-select";

import { Border } from "../miscellaneous/index.jsx";

import "./style.css";

/**
 * generate react-select array objects of queue list:
 * ex. [{value: 0, label: 0}, {value: 1, label: 1}]
 */
const generatePriorityList = n =>
  [...Array(n).keys()].map(num => ({ value: num, label: num }));

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
    const { jobs, queueList, queue, paramsList } = this.props;

    const renderedParamsList = this._renderParamsList();

    const divider = paramsList.length > 0 ? <Border /> : null;

    return (
      <Fragment>
        <div className="input-wrapper">
          <div className="input-label">Tag:</div>
          <input
            type="text"
            placeholder="Required"
            name="tag"
            onChange={this._handleTagInput}
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
              options={this.priorityList}
              onChange={this._handleEditPriority}
              styles={customSelectStyles}
            />
          </div>
        </section>

        {divider}
        {renderedParamsList}
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
  editParams: param => dispatch(ownProps.editParams(param)),
  getQueueList: jobType => dispatch(ownProps.getQueueList(jobType)),
  changeQueue: queue => dispatch(ownProps.changeQueue(queue)),
  editTags: tag => dispatch(ownProps.editTags(tag)),
  editJobPriority: query => dispatch(ownProps.editJobPriority(query))
});

export default connect(null, mapDispatchToProps)(JobSubmitter);
