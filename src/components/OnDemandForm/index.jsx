import React from 'react';
import AceEditor from 'react-ace';
import Select from 'react-select'

import { TOSCA_API_BASE, TOSCA_ACTIONS_API, QUEUE_LIST_API } from '../../config.js';
import { QUEUE_PRIORITIES } from '../../config.js';

import 'brace/mode/json';
import 'brace/theme/github';
import './style.css';

/**
 * TODO:
 *    1. maybe use localstorage to store the curernt state and values (probably not)
 *    2. add error validation in the code editor and disable submit button if its invalid
 *    3. make urls dynamic and change depending on query text box and dropdown changes
 *       window.history.pushState("fjskl", "title", "?dsjkldjslfs")
 *    http://localhost:8080/tosca/on-demand?query=eyJxdWVyeSI6eyJtYXRjaF9hbGwiOnt9fSwic2l6ZSI6MTAsIl9zb3VyY2UiOnsiaW5jbHVkZXMiOlsiKiJdLCJleGNsdWRlcyI6W119LCJmcm9tIjowfQ==&priority=9&queue=system-jobs-queue&action=job-AOI_based_ipf_submitter:release-20190404
 */

class OnDemandForm extends React.Component {
  constructor(props) {
    super(props);
    const urlParams = new URLSearchParams(window.location.search);

    let esQurery = urlParams.get('query') || '';

    if (esQurery) {
      try {
        esQurery = atob(esQurery);
        esQurery = JSON.parse(esQurery)
        delete esQurery.from
        delete esQurery.size
        esQurery = JSON.stringify(esQurery, null, 2)
      } catch (err) {
        console.error(err);
        console.log("Unable to parse base64 encoded ElasticSearch query, defaulting to 5 blank lines");
        esQurery = `\n`;
      }
    } else {
      esQurery = '\n';
    }

    this.state = {
      tags: '', // form fields in the first page
      query: esQurery, // prop passed from the parent component (page)
      actionsInfo: [],
      actions: [],
      selectedAction: urlParams.get('action') ? this._buildDefaultDropdownValue(urlParams.get('action')) : null,
      queueList: [],
      selectedQueue: urlParams.get('queue') ? this._buildDefaultDropdownValue(urlParams.get('queue')) : null,
      recommendedQueue: null,
      priority: urlParams.get('priority') ? this._buildDefaultDropdownValue(urlParams.get('priority')) : null,
      pgeInputs: {} // arguments for the PGE (JSON to make it more dynamic, idk still need to think about this)
    };
    this._handleChange = this._handleChange.bind(this);
    this._handleTagInput = this._handleTagInput.bind(this);
    this._handleSelectAction = this._handleSelectAction.bind(this);
    this._handleQueueChange = this._handleQueueChange.bind(this);
  };

  _handleChange(e) {
    this.setState({
      query: e
    });
    try {
      console.log(JSON.parse(e));
    } catch (err) {
      console.error(err);
    }
  }

  _handleTagInput(e) {
    // handle the tag name, if tag is empty then disable the submit button
    this.setState({
      tags: e.target.value
    });
  }

  _retrieveActions() {
    const toscaActionsEndpoint = `${TOSCA_API_BASE}/${TOSCA_ACTIONS_API}`;
    fetch(toscaActionsEndpoint)
      .then(res => res.json())
      .then(res => {
        let resCopy = Object.assign({}, res);
        resCopy.actions = resCopy.actions.map(row => ({
          label: row.label,
          value: row.wiring['job-specification'],
        }));

        this.setState({
          actionsInfo: res,
          actions: resCopy.actions,
        });
      });
  }

  fetchQueueList(endpoint) {
    fetch(endpoint)
      .then(res => res.json())
      .then(res => {
        res.queues = res.queues.map(row => ({
          label: row,
          value: row,
        }));

        if (res.recommended.length > 0) {
          this.setState({
            queueList: res.queues,
            selectedQueue: {
              label: res.recommended[0],
              value: res.recommended[0],
            }
          });
        } else {
          this.setState({
            queueList: res.queues
          });
        }
      });
  }

  _handleSelectAction(e, v) {
    const jobType = e.value;
    const queueListEndpoint = `${TOSCA_API_BASE}/${QUEUE_LIST_API}?job_type=${jobType}`;
    this.fetchQueueList(queueListEndpoint);
  }

  _handleQueueChange(e, v) {
    this.setState({
      selectedQueue: {
        label: e.value,
        value: e.value,
      }
    })
  }

  _buildDefaultDropdownValue = val => ({
    value: val,
    label: val
  });

  componentDidMount() {
    const { queueList, selectedAction } = this.state;

    if (queueList.length === 0 && selectedAction) {
      const jobType = selectedAction.value;
      const queueListEndpoint = `${TOSCA_API_BASE}/${QUEUE_LIST_API}?job_type=${jobType}`;
      this.fetchQueueList(queueListEndpoint);
    }
    this._retrieveActions();
  }

  render() {
    const { } = this.props;
    const { query, actions, selectedAction, queueList, selectedQueue, priority } = this.state;

    return (
      <div>
        <div className='split on-demand-left'>
          <AceEditor
            mode='json'
            theme='github'
            fontSize={12}
            showPrintMargin={false}
            showGutter={true}
            highlightActiveLine={true}
            setOptions={{
              showLineNumbers: true,
              tabSize: 2,
            }}
            onChange={this._handleChange}
            value={query}
            width='100%'
            maxLines={Infinity}
          />
        </div>

        <div className='split on-demand-right'>
          <div className='right-pane-container'>
            <br />
            <div className='on-demand-tag-wrapper'>
              <div className='on-demand-tag-label'>Tag:</div>
              <input
                type='text'
                placeholder='Required'
                className='on-demand-tag'
                name='tags'
                onChange={this._handleTagInput}
              />
            </div>
            <br />
            <section>
              <div className='on-demand-dropdown-label'>Action:</div>
              <Select
                label='Select Job and Version'
                name='action'
                options={actions}
                defaultValue={selectedAction}
                onChange={this._handleSelectAction}
              />
            </section>
            <br />
            <section>
              <div className='on-demand-dropdown-label'>Queue:</div>
              <Select
                label='Select Queue'
                name='queue'
                options={queueList}
                defaultValue={selectedQueue}
                value={selectedQueue}
                onChange={this._handleQueueChange}
                isDisabled={!queueList.length > 0}
              />
            </section>
            <br />
            <section>
              <div className='on-demand-dropdown-label'>Priority:</div>
              <Select
                label='Select Priority'
                name='priority'
                options={QUEUE_PRIORITIES}
                defaultValue={priority}
              />
            </section>
          </div>
        </div>
      </div>
    );
  }
}

export default OnDemandForm;
