import React from 'react';
import brace from 'brace';
import AceEditor from 'react-ace';
import Select from 'react-select'

import 'brace/mode/json';
import 'brace/theme/github';

import './style.css';

import { TOSCA_API_BASE, TOSCA_ACTIONS_API, QUEUE_LIST_API } from '../../config.js';
import { QUEUE_PRIORITIES } from '../../config.js';

/**
 * TODO:
 *    maybe use localstorage to store the curernt state and values 
 */
class OnDemandForm extends React.Component {
  constructor(props) {
    super(props);

    let queryParam = this.props.match.params.query;
    queryParam = atob(queryParam);
    queryParam = JSON.parse(queryParam)
    delete queryParam.from;
    delete queryParam.size;

    const urlParams = new URLSearchParams(window.location.search);
    
    this.state = {
      tags: '', // form fields in the first page
      query: JSON.stringify(queryParam, null, 2), // prop passed from the parent component (page)
      actions: [],
      defaultAction: urlParams.get('action') ? this._buildDefaultDropdownValue(urlParams.get('action')) : null,
      queueList: [],
      defaultQueue: urlParams.get('queue') ? this._buildDefaultDropdownValue(urlParams.get('queue')) : null,
      recommendedQueue: null,
      priority: urlParams.get('priority') ? this._buildDefaultDropdownValue(urlParams.get('priority')) : null,
      
      // make ajax call to ES to get the required fields for PGE
      pgeInputs: {} // arguments for the PGE (JSON to make it more dynamic)
    };
    this._handleChange = this._handleChange.bind(this);
    this._handleTagInput = this._handleTagInput.bind(this);
  };

  _handleChange(e) {
    this.setState({
      query: e
    });
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
        res.jobspecs = res.jobspecs.map(row => ({
          value: row,
          label: row
        }));
        this.setState({
          actions: res.jobspecs
        });
      });
  }

  _retrieveQueueList() {
    const queueListEndpoint = `${TOSCA_API_BASE}/${QUEUE_LIST_API}`;
    fetch(queueListEndpoint)
      .then(res => res.json())
      .then(res => {
        res.result.queues = res.result.queues.map(row => ({
          value: row,
          label: row
        }));
        
        this.setState({
          queueList: res.result.queues
        });

        if (res.result.recommended.length > 0 && !this.state.defaultQueue) {
          this.setState({
            defaultQueue: res.result.recommended[0]
          })
        }
      })
  }

  _buildDefaultDropdownValue = val => ({
    value: val,
    label: val
  });

  componentDidMount() {
    this._retrieveActions();
    this._retrieveQueueList();
  }

  render() {
    const { } = this.props;
    const { query, actions, defaultAction, queueList, defaultQueue, priority } = this.state;

    //http://localhost:8080/tosca/on-demand/eyJxdWVyeSI6eyJib29sIjp7Im11c3QiOlt7ImJvb2wiOnsibXVzdCI6W3sidGVybSI6eyJfaWQiOiJ2Y2p4ZHNrZmpzZGtoZnNkamsifX0seyJ0ZXJtIjp7IkRlc3QiOiJYaSdhbiBYaWFueWFuZyBJbnRlcm5hdGlvbmFsIEFpcnBvcnQifX0seyJ0ZXJtIjp7IkNhcnJpZXIiOiJKZXRCZWF0cyJ9fV19fV19fSwic2l6ZSI6MTAsIl9zb3VyY2UiOnsiaW5jbHVkZXMiOlsiKiJdLCJleGNsdWRlcyI6W119LCJmcm9tIjowfQ==?priority=9&queue=system-jobs-queue&action=job-AOI_based_ipf_submitter:release-20190404

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
                name='Select Job and Version'
                options={actions}
                defaultValue={defaultAction}
              />
            </section>
            <br />
            <section>
              <div className='on-demand-dropdown-label'>Queue:</div>
              <Select
                label='Select Queue'
                name='queue'
                options={queueList}
                defaultValue={defaultQueue}
                onChange={(e, v) => {console.log(e); console.log(v)}}
                ref='queueRef'
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
