import React from 'react';
import { ReactiveComponent } from '@appbaseio/reactivesearch';
import { Map, TileLayer, FeatureGroup } from 'react-leaflet';

import { EditControl } from "react-leaflet-draw";

import { LEAFLET_TILELAYER, LEAFLET_ATTRIBUTION } from '../../config.js';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './style.css';

/**
 * Map in Tosca to trigger ES searches based on geo location drawing
 * TODO:
 *    migrate data from GRQ to ES 6
 *    make es query compatible with ReactiveSearch **
 *    collapsable text field on the bottom for coordinates
 */
var MapComponent = class ReactiveMap extends React.Component {
  constructor(props) {
    super(props);
    this.polygonCreateEvent = this.polygonCreateEvent.bind(this);
    this.polygonEditEvent = this.polygonEditEvent.bind(this);
    this.removePolygons = this.removePolygons.bind(this);
  }

  componentDidMount() {
    const { setPolygon } = this.props;
    if (setPolygon) {
      const polyArr = JSON.parse(setPolygon);
      this._setQuery(this.props, polyArr);
    }
  }

  componentDidUpdate() {
    // when they clear the facet so it doesnt query with empty coordinates
    if (!this.props.setPolygon) {
      this.props.setQuery({
        query: null,
        value: [], // don't know why it works but as long as query is null we're good
      });
      this.removePolygons();
    }
  }

  _setQuery(props, coordinates) { // passing the ES query back to the wrapper: ReactiveComponent
    const query = {
      query: {
        "bool": {
          "filter": {
            "geo_shape": {
              "location": {
                "shape": {
                  "type": "polygon",
                  "coordinates": [coordinates]
                }
              }
            }
          }
        }
      }
    };
    props.setQuery({
      query,
      value: JSON.stringify(coordinates)
    })
  }

  polygonCreateEvent(e) {
    const coordinates = e.layer.getLatLngs()[0].map(cord => [cord.lng, cord.lat]);
    coordinates.push(coordinates[0]); // GEOJSON NEED THE LAST POINT TO BE THE SAME AS THE FIRST POINT
    this._setQuery(this.props, coordinates);
  }

  polygonEditEvent(e) {
    for (var key in e.layers._layers) {
      let coordinates = e.layers._layers[key]._latlngs[0].map(cord => [cord.lng, cord.lat]);
      coordinates.push(coordinates[0]);

      this._setQuery(this.props, coordinates);
      break;
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
    })
  }

  render() {
    const position = [51.505, -0.09];

    return (
      <Map
        center={position}
        zoom={7}
        minZoom={2}
        maxZoom={8}
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
            onEdited={this.polygonEditEvent}
            draw={{
              circle: false,
              marker: false,
              polyline: false,
              circlemarker: false,
            }}
            edit={{
              remove: false
            }}
          />
        </FeatureGroup>
      </Map>
    )
  }
}

export default class ReactiveMap extends React.Component {
  render() {
    return (
      <ReactiveComponent
        componentId={this.props.mapComponentId}
        URLParams={true}
        render={({ aggregations, setQuery, value }) => {
          return (
            <MapComponent
              setQuery={setQuery}
              setPolygon={value}
            />
          );
        }}
      ></ReactiveComponent>
    );
  }
}