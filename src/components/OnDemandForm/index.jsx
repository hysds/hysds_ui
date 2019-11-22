import React from "react";
import AceEditor from "react-ace";
import Select from "react-select";

import {
  GRQ_API_BASE,
  GRQ_ACTIONS_API,
  QUEUE_LIST_API,
  GRQ_JOB_SPECS_ENDPOINT,
  GRQ_REST_API_V1,
  GRQ_REST_API_V2,
  MOZART_REST_API_V1,
  MOZART_REST_API_V2
} from "../../config.js";
import { QUEUE_PRIORITIES } from "../../config.js";

import "brace/mode/json";
import "brace/theme/github";
import "./style.css";

/**
 * TODO:
 *    1. maybe use localstorage to store the curernt state and values (probably not)
 *    2. add error validation in the code editor and disable submit button if its invalid
 *    3. make urls dynamic and change depending on query text box and dropdown changes
 *       window.history.pushState("fjskl", "title", "?dsjkldjslfs")
 *    http://localhost:8080/tosca/on-demand?query=eyJxdWVyeSI6eyJtYXRjaF9hbGwiOnt9fSwic2l6ZSI6MTAsIl9zb3VyY2UiOnsiaW5jbHVkZXMiOlsiKiJdLCJleGNsdWRlcyI6W119LCJmcm9tIjowfQ==&priority=9&queue=system-jobs-queue&action=job-AOI_based_ipf_submitter:release-20190404
 *    4. AceEditor onValidate and validate query to disable or re-enable submit button
 *    5. need to add jobspec inputs for default values (DONE)
 *    6. check default values and make it submittable or not
 */

class OnDemandForm extends React.Component {
  constructor(props) {
    super(props);
    const urlParams = new URLSearchParams(window.location.search);

    let esQurery = urlParams.get("query") || "";
    try {
      esQurery = atob(esQurery);
      esQurery = JSON.parse(esQurery);
      esQurery = esQurery.query;
      esQurery = JSON.stringify(esQurery, null, 2);
    } catch (err) {
      console.error(err);
      console.log("Unable to parse base64 encoded ElasticSearch query");
      esQurery = "";
    }

    this.state = {
      tag: "", // form fields in the first page
      query: esQurery, // prop psased from the parent component (page)
      totalRecords: urlParams.get("total") ? urlParams.get("total") : 0,
      actionsInfo: [],
      actions: [],
      selectedAction: urlParams.get("action")
        ? this.buildDefaultDropdownValue(urlParams.get("action"))
        : null,
      queueList: [],
      selectedQueue: urlParams.get("queue")
        ? this.buildDefaultDropdownValue(urlParams.get("queue"))
        : null,
      recommendedQueue: null,
      priority: urlParams.get("priority")
        ? this.buildDefaultDropdownValue(urlParams.get("priority"))
        : null,
      jobSpecs: [], // arguments for the PGE (JSON to make it more dynamic, idk still need to think about this)
      jobSpecsInput: {}
    };
    this._handleQueryChange = this._handleQueryChange.bind(this);
    this._handleTagInput = this._handleTagInput.bind(this);
    this._handleSelectAction = this._handleSelectAction.bind(this);
    this._handleQueueChange = this._handleQueueChange.bind(this);
    this._validateESQuery = this._validateESQuery.bind(this);
    this._handleQueuePriority = this._handleQueuePriority.bind(this);
    this.fetchJobSpecs = this.fetchJobSpecs.bind(this);
    this._handleJobSpecDropdown = this._handleJobSpecDropdown.bind(this);
    this._handleJobSpecDropdownBoolean = this._handleJobSpecDropdownBoolean.bind(
      this
    );
    this._handleJobSpecTextInput = this._handleJobSpecTextInput.bind(this);
  }

  componentDidMount() {
    const { queueList, selectedAction } = this.state;

    if (queueList.length === 0 && selectedAction) {
      const jobType = selectedAction.value;
      const queueListEndpoint = `${GRQ_API_BASE}/${QUEUE_LIST_API}?job_type=${jobType}`;
      this.fetchQueueList(queueListEndpoint);
    }
    this._retrieveActions();
  }

  _handleQueryChange(e) {
    this.setState({
      query: e
    });
    try {
      // console.log(JSON.parse(e));
    } catch (err) {
      console.error(err);
    }
  }

  _validateESQuery(e) {
    // console.log(e);
  }

  _handleTagInput(e) {
    // handle the tag name, if tag is empty then disable the submit button
    this.setState({
      tag: e.target.value
    });
  }

  _retrieveActions() {
    const toscaActionsEndpoint = `${GRQ_API_BASE}/${GRQ_ACTIONS_API}`;
    fetch(toscaActionsEndpoint)
      .then(res => res.json())
      .then(res => {
        let resCopy = Object.assign({}, res);
        resCopy.actions = resCopy.actions.map(row => ({
          label: row.label,
          // value: row.job_type
          value: row.wiring["job-specification"]
        }));

        this.setState({
          actionsInfo: res,
          actions: resCopy.actions
        });
      });
  }

  fetchQueueList(endpoint) {
    fetch(endpoint)
      .then(res => res.json())
      .then(res => {
        res.queues = res.queues.map(row => ({
          label: row,
          value: row
        }));

        if (res.recommended.length > 0) {
          this.setState({
            queueList: res.queues,
            selectedQueue: {
              label: res.recommended[0],
              value: res.recommended[0]
            }
          });
        } else {
          this.setState({
            queueList: res.queues
          });
        }
      });
  }

  fetchJobSpecs(job) {
    // fetches the job specs and sets the state in state.jobSpecss
    const endpoint = `${GRQ_API_BASE}/${GRQ_JOB_SPECS_ENDPOINT}/${job}`;
    fetch(endpoint)
      .then(res => res.json())
      .then(res => {
        const filteredRes = res.filter(row => row.from === "submitter");

        let jobSpecsInput = {};
        for (var i = 0; i < filteredRes.length; i++) {
          const jobSpec = filteredRes[i];
          const defaultVal =
            jobSpec.default === "true" || jobSpec.default === "false"
              ? jobSpec.default === "true"
                ? true
                : false
              : jobSpec.default;
          if (jobSpec.default) jobSpecsInput[jobSpec.name] = defaultVal;
        }

        this.setState({
          jobSpecs: filteredRes,
          jobSpecsInput: jobSpecsInput
        });
      });
  }

  _handleSelectAction(e, v) {
    const jobType = e.value;
    const queueListEndpoint = `${GRQ_API_BASE}/${QUEUE_LIST_API}?job_type=${jobType}`;
    this.fetchQueueList(queueListEndpoint);
    this.fetchJobSpecs(jobType);
    this.setState({
      selectedAction: jobType
    });
  }

  _handleQueueChange(e, v) {
    this.setState({
      selectedQueue: {
        label: e.value,
        value: e.value
      }
    });
  }

  _handleQueuePriority(e, v) {
    this.setState({
      priority: e.value
    });
  }

  _handleJobSpecDropdown(e, v) {
    let { jobSpecsInput } = this.state;
    const name = v.name; // job input name
    const value = e.value; // job input value

    jobSpecsInput[name] = value;
    this.setState({
      jobSpecsInput: jobSpecsInput
    });
  }

  _handleJobSpecDropdownBoolean(e, v) {
    let { jobSpecsInput } = this.state;
    const name = v.name; // job input name
    const value = e.value; // job input value

    jobSpecsInput[name] = value === "true" ? true : false;
    this.setState({
      jobSpecsInput: jobSpecsInput
    });
  }

  _handleJobSpecTextInput(e) {
    let { jobSpecsInput } = this.state;
    const name = e.target.name;
    const value = e.target.value;

    if (value.length > 0) jobSpecsInput[name] = value;
    else delete jobSpecsInput[name];

    this.setState({
      jobSpecsInput: jobSpecsInput
    });
  }

  buildDefaultDropdownValue = val => ({
    value: val,
    label: val
  });

  render() {
    const {} = this.props;
    const {
      tag,
      query,
      actions,
      selectedAction,
      queueList,
      selectedQueue,
      priority,
      jobSpecs,
      jobSpecsInput
    } = this.state;
    console.log(jobSpecsInput);

    const selectStyles = {
      container: base => ({
        ...base,
        borderColor: "green",
        minWidth: "0px"
      })
    };

    const submitButton =
      tag.length > 0 &&
      selectedAction !== null &&
      selectedQueue !== null &&
      priority !== null ? (
        <button className="on-demand-submit-button">Submit</button>
      ) : (
        <button disabled={true} className="on-demand-submit-button-disabled">
          Submit
        </button>
      );

    const jobSpecsSeparator =
      jobSpecs.length > 0 ? (
        <span style={{ margin: 20 }}>
          <hr />
        </span>
      ) : null;

    const jobSpecOptions = jobSpecs.map(row => {
      if (row.type === "enum") {
        return (
          <div key={row.name}>
            <div className="jobspecs-dropdown-label">{row.name}: </div>
            <Select
              label={row.name}
              name={row.name}
              defaultValue={this.buildDefaultDropdownValue(row.default)}
              value={this.buildDefaultDropdownValue(jobSpecsInput[row.name])}
              options={row.enumerables.map(option => ({
                value: option,
                label: option
              }))}
              style={selectStyles}
              onChange={this._handleJobSpecDropdown}
            />
            <br />
          </div>
        );
      } else if (row.type === "boolean") {
        return (
          <div key={row.name}>
            <div className="jobspecs-dropdown-label">{row.name}: </div>
            <Select
              label={row.name}
              name={row.name}
              defaultValue={this.buildDefaultDropdownValue(row.default)}
              value={this.buildDefaultDropdownValue(
                jobSpecsInput[row.name].toString()
              )}
              options={["true", "false"].map(bool => ({
                value: bool,
                label: bool
              }))}
              style={selectStyles}
              onChange={this._handleJobSpecDropdownBoolean}
            />
          </div>
        );
      } else {
        return (
          <div key={row.name}>
            <div className="jobspecs-dropdown-label">{row.name}: </div>
            <input
              type="text"
              placeholder={row.placeholder}
              className="on-demand-input"
              name={row.name}
              value={jobSpecsInput[row.name]}
              onChange={this._handleJobSpecTextInput}
            />
            <br />
          </div>
        );
      }
    });

    return (
      <div>
        <div className="split on-demand-left">
          <AceEditor
            mode="json"
            theme="github"
            fontSize={12}
            showPrintMargin={false}
            showGutter={true}
            highlightActiveLine={true}
            setOptions={{
              showLineNumbers: true,
              tabSize: 2
            }}
            onChange={this._handleQueryChange}
            value={query}
            width="100%"
            maxLines={Infinity}
            onValidate={this._validateESQuery}
          />
        </div>

        <div className="split on-demand-right">
          <div className="right-pane-container">
            <br />
            {this.state.totalRecords} Records from query
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
            <br />
            <section>
              <div className="on-demand-dropdown-label">Action:</div>
              <Select
                label="Select Job and Version"
                name="action"
                options={actions}
                defaultValue={selectedAction}
                onChange={this._handleSelectAction}
                style={selectStyles}
              />
            </section>
            <br />
            <section>
              <div className="on-demand-dropdown-label">Queue:</div>
              <Select
                label="Select Queue"
                name="queue"
                options={queueList}
                defaultValue={selectedQueue}
                value={selectedQueue}
                onChange={this._handleQueueChange}
                isDisabled={!queueList.length > 0}
                style={selectStyles}
              />
            </section>
            <br />
            <section>
              <div className="on-demand-dropdown-label">Priority:</div>
              <Select
                label="Select Priority"
                name="priority"
                options={QUEUE_PRIORITIES}
                defaultValue={priority}
                onChange={this._handleQueuePriority}
                style={selectStyles}
              />
            </section>
            <br />
            {jobSpecsSeparator}
            <section>{jobSpecOptions}</section>
            <br />
            <br />
            {submitButton}
          </div>
        </div>
      </div>
    );
  }
}

export default OnDemandForm;
