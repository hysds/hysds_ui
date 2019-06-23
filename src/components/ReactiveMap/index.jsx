import React from 'react';
import PropTypes from 'prop-types';
import { ReactiveComponent } from '@appbaseio/reactivesearch';
import { Map, TileLayer, FeatureGroup, Polygon } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";

import { LEAFLET_TILELAYER, LEAFLET_ATTRIBUTION } from '../../config.js';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './style.css';

/**
 * Map in Tosca to trigger ES searches based on geo location drawing
 * TODO:
 *    migrate data from GRQ to ES 7 (KIND OF DONE)
 *    make es query compatible with ReactiveSearch ** (DONE)
 *    collapsable text field on the bottom for coordinates (DONE I THINK)
 *    add images to the map
 */
var MapComponent = class ReactiveMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      textBoxValue: ''
    };

    this.polygonCreateEvent = this.polygonCreateEvent.bind(this);
    this.removePolygons = this.removePolygons.bind(this);
    this.polygonTextInput = this.polygonTextInput.bind(this);
    this.polygonTextChange = this.polygonTextChange.bind(this);
  }

  componentDidMount() {
    const { setPolygon } = this.props;
    if (setPolygon) {
      const polyArr = JSON.parse(setPolygon);
      this._setQuery(this.props, polyArr);

      let inputPolygon = (setPolygon === null || setPolygon.length === 0) ? null : JSON.parse(setPolygon);
      // inputPolygon.pop();
      this.setState({
        inputPolygon: inputPolygon.map((row) => [row[1], row[0]]), // reversing polygon to be compatible with leaflet
        textBoxValue: JSON.stringify(inputPolygon)
      });
    }
  }

  componentDidUpdate() {
    // when they clear the facet so it doesnt query with empty coordinates
    if (!this.props.setPolygon) {
      this.props.setQuery({
        query: null,
        value: [], // don't know why it works but as long as query is null we're good
      });

      this.setState({
        inputPolygon: [], // so we can remove the defualt polygon when we "clear all"
        textBoxValue: ''
      });

      this.removePolygons();
    }
  }

  _setQuery(props, polygon) { // passing the ES query back to the wrapper: ReactiveComponent
    const query = {
      query: {
        "bool": {
          "filter": {
            "geo_shape": {
              "location": {
                "shape": {
                  "type": "polygon",
                  "coordinates": [polygon]
                }
              }
            }
          }
        }
      }
    };
    props.setQuery({
      query,
      value: JSON.stringify(polygon)
    })
  }

  polygonCreateEvent(e) {
    const polygon = e.layer.getLatLngs()[0].map(cord => [cord.lng, cord.lat]);
    polygon.push(polygon[0]); // GEOJSON NEED THE LAST POINT TO BE THE SAME AS THE FIRST POINT
    this._setQuery(this.props, polygon);

    this.setState({
      inputPolygon: null,
      textBoxValue: JSON.stringify(polygon)
    });
  }

  polygonTextChange(e) {
    this.setState({
      textBoxValue: e.target.value
    });
  }

  polygonTextInput(e) {
    if (e.key === 'Enter' && e.shiftKey) {
      // e.preventDefault();
      try {
        const textValue = e.target.value;
        if (textValue.trim() === '') return;  // do nothing if text is blank

        let inputPolygon = JSON.parse(textValue);
        this.setState({
          inputPolygon: inputPolygon.map((row) => [row[1], row[0]]),
          textBoxValue: JSON.stringify(inputPolygon)
        });
        this.removePolygons();
        this._setQuery(this.props, inputPolygon);
      } catch (err) {
        alert("Not valid JSON")
      }
    }
  }

  removePolygons() { // to remove the already drawn polygon if you're drawing a new one
    const { edit } = this.refs;
    const layerContainer = edit.leafletElement.options.edit.featureGroup;
    const layers = layerContainer._layers;
    const layerIds = Object.keys(layers);

    layerIds.forEach(id => {
      var layer = layers[id];
      layerContainer.removeLayer(layer);
    });
  }

  render() {
    const { defaultZoom, maxZoom, minZoom } = this.props;
    const { inputPolygon, textBoxValue } = this.state;
    const position = [36.7783, -119.4179];

    return (
      <div className='map-container'>
        <Map
          center={position}
          zoom={defaultZoom}
          minZoom={minZoom}
          maxZoom={maxZoom}
        >
          <TileLayer
            url={LEAFLET_TILELAYER}
            attribution={LEAFLET_ATTRIBUTION}
          />
          <FeatureGroup>
            <EditControl
              ref="edit"
              position='topleft'
              onDrawStart={this.removePolygons}
              onCreated={this.polygonCreateEvent}
              onDeleted={this._onDeleted}
              draw={{
                circle: false,
                marker: false,
                polyline: false,
                circlemarker: false,
              }}
              edit={{
                remove: false,
                edit: false
              }}
            />
          </FeatureGroup>
          {
            inputPolygon !== [] && inputPolygon !== null && inputPolygon !== undefined ?
              (<Polygon positions={inputPolygon} color="#3388ff" opacity={0.5} />) :
              null
          }
        </Map>
        <textarea
          className='map-coordinates-textbox'
          placeholder={`Press SHIFT + ENTER to manually input polygon...\n ex. [ [-125.09335, 42.47589], ... ,[-125.09335, 42.47589] ]`}
          value={textBoxValue}
          onChange={this.polygonTextChange}
          onKeyPress={this.polygonTextInput}
        >
        </textarea>
      </div>
    )
  }
}

export default class ReactiveMap extends React.Component {
  render() {
    return (
      <ReactiveComponent
        componentId={this.props.mapComponentId}
        URLParams={true}
        onAllData={(data, rawData, aggregations) => {
          console.log(data);
          console.log(rawData);
          console.log(aggregations);
        }}
        render={({ setQuery, value }) => {
          return (
            <MapComponent
              setQuery={setQuery}
              setPolygon={value}
              defaultZoom={this.props.defaultZoom}
              maxZoom={this.props.maxZoom}
              minZoom={this.props.minZoom}
            />
          );
        }}
      ></ReactiveComponent>
    );
  }
}

ReactiveMap.propTypes = {
  mapComponentId: PropTypes.string.isRequired
};

ReactiveMap.defaultProps = {
  defaultZoom: 6,
  maxZoom: 10,
  minZoom: 0
};
