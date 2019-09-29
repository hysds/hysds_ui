import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { ReactiveComponent } from '@appbaseio/reactivesearch';
import { Map, TileLayer, FeatureGroup, Polygon, ImageOverlay, Popup, Marker } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";

import { LEAFLET_TILELAYER, LEAFLET_ATTRIBUTION, DEFAULT_MAP_DISPLAY } from '../../config.js';
import { _extractPolygonData, _switchPolygonCoordinates } from './utils.js'

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './style.css';

import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

const DRAW_POLYGON_COLOR = '#f06eaa';
const DRAW_POLYGON_WEIGHT = 7;

/**
 * Map in Tosca to trigger ES searches based on geo location drawing
 * TODO:
 *    migrate data from GRQ to ES 7 (KIND OF DONE)
 *    make es query compatible with ReactiveSearch ** (DONE)
 *    collapsable text field on the bottom for coordinates (DONE I THINK)
 *    add images to the map (DONE)
 *    add highlighting when clicking (need callbacks)
 */
var MapComponent = class extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      displayMap: DEFAULT_MAP_DISPLAY,
      textBoxValue: '',
      zoomLevel: props.defaultZoom
    };

    this.toggleMapDisplay = this.toggleMapDisplay.bind(this);
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
      this.setState({
        inputPolygon: _switchPolygonCoordinates(inputPolygon),
        textBoxValue: JSON.stringify(inputPolygon)
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
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

  toggleMapDisplay() {
    const { map } = this.refs;
    this.setState({
      displayMap: !this.state.displayMap
    },
      map.leafletElement._onResize() // this forces leaflet to redraw the map
    );
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
      try {
        const textValue = e.target.value;
        if (textValue.trim() === '') return;  // do nothing if text is blank

        let inputPolygon = JSON.parse(textValue);
        this.setState({
          inputPolygon: _switchPolygonCoordinates(inputPolygon),
          textBoxValue: JSON.stringify(inputPolygon)
        });

        this.removePolygons();
        this._setQuery(this.props, inputPolygon);
      } catch (err) {
        alert("Not valid JSON");
      }
      e.preventDefault();
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
    const { defaultZoom, maxZoom, minZoom, facetData } = this.props;
    const { displayMap, inputPolygon, textBoxValue, zoomLevel } = this.state;
    const mapContainerStyles = displayMap ? {} : { display: 'none' }; // to toggle the map

    // extracting and morphing the coordinates in the data from elasticsearch
    const extractedData = _extractPolygonData(facetData);
    const center = extractedData.length === 0 ? [36.7783, -119.4179] : extractedData[0].center;

    return (
      <div className="reactive-map-container">
        <button
          onClick={this.toggleMapDisplay}>
          {displayMap ? 'Hide Map' : 'Show Map'}
        </button>
        <div className='map-container'>
          <Map
            ref='map'
            center={center}
            zoom={zoomLevel}
            minZoom={minZoom}
            maxZoom={maxZoom}
            style={mapContainerStyles}
          // onViewportChange={e => this.setState({ zoomLevel: e.zoom })}
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
                  polygon: {
                    shapeOptions: {
                      color: DRAW_POLYGON_COLOR,
                      weight: DRAW_POLYGON_WEIGHT,
                      fill: false,
                    }
                  },
                  rectangle: {
                    shapeOptions: {
                      color: DRAW_POLYGON_COLOR,
                      weight: DRAW_POLYGON_WEIGHT,
                      fill: false,
                    }
                  },
                }}
                edit={{
                  remove: false,
                  edit: false
                }}
              />
            </FeatureGroup>
            {
              inputPolygon !== [] && inputPolygon !== null && inputPolygon !== undefined ?
                (<Polygon positions={inputPolygon} color="#3388ff" opacity={0.5} fillOpacity={0.2} />) :
                null
            }
            {extractedData.map(row => (
              <Fragment>
                <Polygon
                  key={`${row._index}/${row._id}`}
                  positions={row.polygon}
                  color="#3388ff"
                  opacity={1}
                  fillOpacity={0}
                  weight={1.1}
                >
                  <Popup>
                    <div style={{ wordWrap: 'break-word' }} onClick={this.props.clickIdHandler.bind(this, row._id)}>
                      {row._id}
                    </div>
                  </Popup>
                </Polygon>
                {/* <Marker position={row.center}>
                  <Popup>
                    <div style={{ wordWrap: 'break-word' }} onClick={this.props.clickIdHandler.bind(this, row._id)}>
                      {row._id}
                    </div>
                  </Popup>
                </Marker> */}
              </Fragment>
            ))}
            {extractedData.map(row => (
              <ImageOverlay
                key={`${row._index}/${row._id}_imageOverlay`}
                url={row.imageUrl}
                bounds={row.polygon}
                opacity={1}
              />
            ))}
          </Map>
        </div>
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
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <ReactiveComponent
        componentId={this.props.mapComponentId}
        URLParams={true}
        render={({ setQuery, value }) => {
          return (
            <MapComponent
              setQuery={setQuery}
              setPolygon={value}
              defaultZoom={this.props.defaultZoom}
              maxZoom={this.props.maxZoom}
              minZoom={this.props.minZoom}
              facetData={this.props.facetData}
              clickIdHandler={this.props.clickIdHandler}
            />
          );
        }}
      />
    );
  }
}

ReactiveMap.propTypes = {
  mapComponentId: PropTypes.string.isRequired,
  clickIdHandler: PropTypes.func.isRequired,
};

ReactiveMap.defaultProps = {
  defaultZoom: 6,
  maxZoom: 10,
  minZoom: 0,
  facetData: []
};
