import React from 'react';
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
export default class ReactiveMap extends React.Component {
  constructor(props) {
    super(props);
    const coordinates = JSON.parse(props.selectedValue);

    this.state = {
      coordinates: coordinates || []
    }
    this.polygonCreateEvent = this.polygonCreateEvent.bind(this);
    this.polygonEditEvent = this.polygonEditEvent.bind(this);

    if (coordinates) {
      this.setQuery(props, coordinates); // query on page load
    }
  }

  componentDidUpdate() {
    // when they clear the facet so it doesnt query with empty coordinates
    if (!this.props.selectedValue) {
      this.props.setQuery({
        query: null,
        value: [], // don't know why it works but as long as query is null we're good
        selectedValue: null
      });
    }
  }

  setQuery(props, coordinates) { // passing the ES query back to the wrapper: ReactiveComponent
    props.setQuery({
      query: {
        term: {
          polygon: coordinates
        }
      },
      value: coordinates ? JSON.stringify(coordinates) : [],
      selectedValue: coordinates,
    });
  }

  polygonCreateEvent(e) {
    const coordinates = e.layer.getLatLngs()[0].map(cord => [cord.lat, cord.lng])
    this.setState({
      coordinates: coordinates // keeping track of the coordinates
    })
    this.setQuery(this.props, coordinates);
  }

  polygonEditEvent(e) {
    for (var key in e.layers._layers) {
      let coordinates = e.layers._layers[key]._latlngs[0].map(cord => [cord.lat, cord.lng]);
      this.setState({
        coordinates: coordinates
      })
      this.setQuery(this.props, coordinates);
      break;
    }
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
            position='topleft' // 'topright'
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
    );
  }
}
