import React from 'react';
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
 *    migrate data from GRQ to ES 7 (DONE)
 *    make es query compatible with ReactiveSearch ** (DONE)
 *    collapsable text field on the bottom for coordinates (NOT SURE WHAT THIS MEANS)
 */
var MapComponent = class ReactiveMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.polygonCreateEvent = this.polygonCreateEvent.bind(this);
    this.polygonEditEvent = this.polygonEditEvent.bind(this);
    this.removePolygons = this.removePolygons.bind(this);
  }

  componentDidMount() {
    const { setPolygon } = this.props;
    if (setPolygon) {
      const polyArr = JSON.parse(setPolygon);
      this._setQuery(this.props, polyArr);

      let defaultPolygon = (setPolygon === null || setPolygon.length === 0) ? null : JSON.parse(setPolygon);
      defaultPolygon.pop();
      this.setState({
        defaultPolygon: defaultPolygon.map((row) => [row[1], row[0]]) // reversing polygon to be compatible with leaflet
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
        defaultPolygon: [] // so we can remove the defualt polygon when we "clear all"
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
      defaultPolygon: null
    });
  }

  polygonEditEvent(e) {
    for (var key in e.layers._layers) {
      let polygon = e.layers._layers[key]._latlngs[0].map(cord => [cord.lng, cord.lat]);
      polygon.push(polygon[0]);

      this._setQuery(this.props, polygon);
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
    });
  }

  render() {
    const { defaultPolygon } = this.state;
    const position = [36.7783, -119.4179];

    return (
      <Map
        center={position}
        zoom={6}
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
              remove: false,
              edit: false
            }}
          />
        </FeatureGroup>
        {
          defaultPolygon !== [] && defaultPolygon !== null && defaultPolygon !== undefined ?
            (<Polygon positions={defaultPolygon} color="#3388ff" opacity={0.5} />) :
            null
        }
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