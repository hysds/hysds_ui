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
  [...Array(n).keys()].map(num => ({ value: num, label: num }));

class OnDemandJobSubmitter extends React.Component {
  constructor(props) {
    super(props);
    this.priorityList = generatePriorityList(10);
    this.state = {};
  }

  _handleTagInput = e => this.props.editTags(e.target.value);
  _handleJobChange = e => {
    this.props.changeJobType(e.value);
    this.props.getQueueList(e.value);
    this.props.getjobParamsList(e.value);
  };
  _handleQueueChange = e => this.props.changeQueue(e.value);
  _handleEditPriority = e => this.props.editJobPriority(e.value);

  _handleJobParamInputChange = e => {
    const payload = {
      name: e.target.name,
      value: e.target.value
    };
    this.props.editJobParams(payload);
  };

  _handleJobParamDropdownChange = (e, v) => {
    const payload = {
      name: v.name,
      value: e.value
    };
    this.props.editJobParams(payload);
  };

  _renderjobParamsList = () => {
    const { jobParams } = this.props;
    return this.props.jobParamsList.map(param => {
      // console.log(this.props.jobParams[name]);
      switch (param.type) {
        case "number":
          return (
            <div className="on-demand-input-wrapper" key={param.name}>
              <div className="on-demand-input-label">{param.name}:</div>
              <input
                className="on-demand-input"
                type="number"
                name={param.name}
                onChange={this._handleJobParamInputChange}
                step="1"
              />
            </div>
          );
        case "enum":
          const val = jobParams[param.name];
          return (
            <section className="on-demand-dropdown-wrapper" key={param.name}>
              <div className="on-demand-dropdown-label">{param.name}:</div>
              <div className="react-select-wrapper">
                <Select
                  label={param.name}
                  value={{ label: val, value: val || "" }}
                  name={param.name}
                  options={param.enumerables.map(option => ({
                    label: option,
                    value: option
                  }))}
                  // value={{ label: queue, value: queue }}
                  onChange={this._handleJobParamDropdownChange}
                />
              </div>
            </section>
          );
        default:
          return (
            <div className="on-demand-input-wrapper" key={param.name}>
              <div className="on-demand-input-label">{param.name}:</div>
              <input
                type="text"
                placeholder="Required"
                className="on-demand-input"
                onChange={this._handleJobParamInputChange}
                name={param.name}
                // onChange={this._handleTagInput}
              />
            </div>
          );
      }
    });
  };

  render() {
    const { jobs, queueList, queue, jobParamsList } = this.props;

    const renderedjobParamsList = this._renderjobParamsList();

    const divider =
      jobParamsList.length > 0 ? <hr className="job-param-border" /> : null;

    return (
      <Fragment>
        <div className="on-demand-input-wrapper">
          <div className="on-demand-input-label">Tag:</div>
          <input
            type="text"
            placeholder="Required"
            className="on-demand-input"
            name="tag"
            onChange={this._handleTagInput}
          />
        </div>

        <section className="on-demand-dropdown-wrapper">
          <div className="on-demand-dropdown-label">Jobs:</div>
          <div className="react-select-wrapper">
            <Select
              label="Select Job"
              name="job"
              options={jobs}
              onChange={this._handleJobChange}
            />
          </div>
        </section>

        <section className="on-demand-dropdown-wrapper">
          <div className="on-demand-dropdown-label">Queue:</div>
          <div className="react-select-wrapper">
            <Select
              label="Queue"
              name="queue"
              options={queueList}
              value={{ label: queue, value: queue }}
              onChange={this._handleQueueChange}
              isDisabled={!(queueList.length > 0)}
            />
          </div>
        </section>

        <section className="on-demand-dropdown-wrapper">
          <div className="on-demand-dropdown-label">Priority:</div>
          <div className="react-select-wrapper">
            <Select
              label="Priority"
              name="priority"
              options={this.priorityList}
              // value={}
              onChange={this._handleEditPriority}
            />
          </div>
        </section>

        {divider}
        {renderedjobParamsList}
      </Fragment>
    );
  }
}

OnDemandJobSubmitter.propTypes = {
  changeJobType: PropTypes.func.isRequired,
  getQueueList: PropTypes.func.isRequired,
  changeQueue: PropTypes.func.isRequired,
  editJobPriority: PropTypes.func.isRequired,
  editTags: PropTypes.func.isRequired
};

// Redux actions
const mapDispatchToProps = (dispatch, ownProps) => ({
  changeJobType: jobType => dispatch(ownProps.changeJobType(jobType)),
  getjobParamsList: jobType => dispatch(ownProps.getjobParamsList(jobType)),
  editJobParams: param => dispatch(ownProps.editJobParams(param)),
  getQueueList: jobType => dispatch(ownProps.getQueueList(jobType)),
  changeQueue: queue => dispatch(ownProps.changeQueue(queue)),
  editTags: tag => dispatch(ownProps.editTags(tag)),
  editJobPriority: query => dispatch(ownProps.editJobPriority(query))
});

export default connect(null, mapDispatchToProps)(OnDemandJobSubmitter);
