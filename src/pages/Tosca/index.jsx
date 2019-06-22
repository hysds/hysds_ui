import React from 'react';
import { ReactiveBase, DataSearch, SingleList, SelectedFilters, DateRange, ReactiveComponent, ReactiveList } from '@appbaseio/reactivesearch';

import { GRQ_ES_URL, GRQ_ES_INDICES } from '../../config';

import IDSearchBar from '../../components/IDSearchBar/index.jsx';
import ReactiveMap from '../../components/ReactiveMap/index.jsx';
import ResultsList from '../../components/ResultsList/index.jsx';

import './style.css';

// reactivesearch retrieves data from each component by its componentId
const ID_SEARCHBAR_COMPONENT_ID = 'ID';
const SEARCHBAR_COMPONENT_ID = 'query_string';
const DATASET_TYPE_SEARCH_ID = 'dataset_type';
const SATELLITE_TYPE_ID = 'satellite';
const MAP_COMPONENT_ID = 'polygon';
const RESULTS_LIST_COMPONENT_ID = 'results';
const DATASET_ID = 'dataset';
const TRACK_NUMBER_ID = 'track_number';
const START_TIME_ID = 'starttime';
const END_TIME_ID = 'endtime';


export default class Tosca extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      esQuery: null
    };
  }

  _handleTransformRequest(e) { // handles the request to ES (also where to get es query)
    const query = e.body.split('\n')[1];
    this.setState({
      query: query ? btoa(query) : '' // saving base64 encoded query in state so we can use it 'on demand'
    });
    return e;
  }

  render() {
    const queryParams = { // query logic for elasticsearch
      'and': [
        // SEARCHBAR_COMPONENT_ID,
        DATASET_TYPE_SEARCH_ID,
        SATELLITE_TYPE_ID,
        MAP_COMPONENT_ID,
        DATASET_ID,
        TRACK_NUMBER_ID,
        START_TIME_ID,
        END_TIME_ID,
      ]
    };

    return (
      <div className='main-container'>
        <ReactiveBase
          app={GRQ_ES_INDICES}
          url={GRQ_ES_URL}
          transformRequest={this._handleTransformRequest.bind(this)}
          beforeSend={e => console.log(e)}
        >
          <div className='sidenav'>
            {/* <DataSearch
              componentId={SEARCHBAR_COMPONENT_ID}
              dataField={['dataset_type']}
              placeholder='Dataset Type'
              URLParams={true}
            /> */}
            {/* <br /> */}
            <SingleList
              componentId={DATASET_ID}
              dataField='dataset.raw'
              title='Dataset'
              URLParams={true}
              style={{ fontSize: 12 }}
              className="reactivesearch-input"
            />
            <SingleList
              componentId={DATASET_TYPE_SEARCH_ID}
              dataField='dataset_type.raw'
              title='Dataset Type'
              URLParams={true}
              style={{ fontSize: 12 }}
              className="reactivesearch-input"
            />

            <br />
            <SingleList
              componentId={SATELLITE_TYPE_ID}
              dataField='metadata.platform.raw'
              title='Carriers'
              URLParams={true}
              style={{ fontSize: 12 }}
              className="reactivesearch-input"
            />

            <DateRange
              componentId={START_TIME_ID}
              title="Start Time"
              dataField="starttime"
              style={{ fontSize: 12 }}
            />
            <br />
            <DateRange
              componentId={END_TIME_ID}
              title="End Time"
              dataField="endtime"
              style={{ fontSize: 12 }}
            />

            <br />
            <br />
            <SingleList
              componentId={TRACK_NUMBER_ID}
              dataField='metadata.trackNumber'
              title='Track Number'
              URLParams={true}
              style={{ fontSize: 12 }}
              className="reactivesearch-input"
            />
          </div>

          <div className='body'>
            <SelectedFilters className='filterList' />

            <a
              className='on-demand-button'
              href={`/tosca/on-demand?query=${this.state.query}`}
              target='_blank'
            >
              On Demand
            </a>

            <ReactiveMap mapComponentId={MAP_COMPONENT_ID} />
            <br />
            <ResultsList
              componentId={RESULTS_LIST_COMPONENT_ID}
              queryParams={queryParams}
            />
            <br />
          </div>
        </ReactiveBase>
      </div>
    );
  }
}
