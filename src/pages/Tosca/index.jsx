import React from 'react';
import { ReactiveBase, DataSearch, SingleList, SelectedFilters, ReactiveComponent, ReactiveList } from '@appbaseio/reactivesearch';

import { GRQ_ES_URL, GRQ_ES_INDICES } from '../../config';

import IDSearchBar from '../../components/IDSearchBar/index.jsx';
import ReactiveMap from '../../components/ReactiveMap/index.jsx';
import ResultsList from '../../components/ResultsList/index.jsx';

import './style.css';

// reactivesearch retrieves data from each component by its componentId
const ID_SEARCHBAR_COMPONENT_ID = 'ID';
const SEARCHBAR_COMPONENT_ID = 'query_string';
const DESTINATION_SEARCH_COMPONENT_ID = 'destination-list';
const CARRIER_LIST_COMPONENT_ID = 'carrier-list'
const MAP_COMPONENT_ID = 'polygon-map';
const RESULTS_LIST_COMPONENT_ID = 'results';


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
        ID_SEARCHBAR_COMPONENT_ID,
        SEARCHBAR_COMPONENT_ID,
        DESTINATION_SEARCH_COMPONENT_ID,
        CARRIER_LIST_COMPONENT_ID,
        MAP_COMPONENT_ID,
      ],
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
            <ReactiveComponent
              componentId={ID_SEARCHBAR_COMPONENT_ID}
              URLParams={true}
            >
              <IDSearchBar refs='idSearchBar' />
            </ReactiveComponent>

            <br />
            <DataSearch
              componentId={SEARCHBAR_COMPONENT_ID}
              dataField={['Dest', 'Carrier']}
              placeholder='Search for Airports'
              URLParams={true}
            />
            <br />
            <SingleList
              componentId={DESTINATION_SEARCH_COMPONENT_ID}
              dataField='Dest'
              title='Destinations'
              URLParams={true}
              style={{ fontSize: 13 }}
            />

            <br />
            <SingleList
              componentId={CARRIER_LIST_COMPONENT_ID}
              dataField='Carrier'
              title='Carriers'
              URLParams={true}
              style={{ fontSize: 13 }}
            />
          </div>

          <div className='body' style={{ minWidth: 750 }}>
            <SelectedFilters className='filterList' />

            <a
              className='on-demand-button'
              href={`tosca/on-demand/${this.state.query}`}
              target='_blank'
            >
              On Demand
            </a>

            <ReactiveComponent
              componentId={MAP_COMPONENT_ID}
              URLParams={true}
            >
              <ReactiveMap
                dataCoordinates={[]} // pass array of coordinates to draw in the leaflet map
              />
            </ReactiveComponent>
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
