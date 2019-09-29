import React from 'react';
import { ReactiveComponent } from '@appbaseio/reactivesearch';

import L from 'leaflet';
import 'leaflet-draw';

import { LEAFLET_TILELAYER, LEAFLET_ATTRIBUTION, DEFAULT_MAP_DISPLAY } from '../../config.js';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './style.css';

const DRAW_POLYGON_COLOR = '#f06eaa';
const DRAW_POLYGON_WEIGHT = 7;

let MapComponent = class extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      displayMap: DEFAULT_MAP_DISPLAY,
      layers: [],
      value: null,
    };
    this._toggleMapDisplay = this._toggleMapDisplay.bind(this);
  }

  componentDidMount() {
    const that = this; // so we can run ReactiveComponent methods

    this.map = L.map('leaflet-map-id', { // initializing the map
      center: [36.7783, -119.4179],
      maxZoom: 8,
      minZoom: 3,
      zoom: localStorage.getItem('zoom') || 5,
      layers: [L.tileLayer(LEAFLET_TILELAYER, { attribution: LEAFLET_ATTRIBUTION })]
    });

    this.drawnItems = new L.FeatureGroup();
    this.map.addLayer(this.drawnItems);

    this.layerGroup = L.layerGroup().addTo(this.map);  // store all dataset panels in this layergroup

    let drawControl = new L.Control.Draw({
      edit: {
        featureGroup: this.drawnItems,
        remove: false,
      },
      draw: {
        circle: false,
        marker: false,
        polyline: false,
        circlemarker: false,
        polygon: {
          shapeOptions: {
            color: DRAW_POLYGON_COLOR,
            weight: DRAW_POLYGON_WEIGHT
          }
        },
        rectangle: {
          shapeOptions: {
            color: DRAW_POLYGON_COLOR,
            weight: DRAW_POLYGON_WEIGHT
          }
        },
      },
    });
    this.map.addControl(drawControl);

    this.map.on('zoomend', this._zoomHandler);
    this.map.on('draw:drawstart', this._clearDatasets);
    this.map.on('draw:created', (event) => {
      let newLayer = event.layer;
      newLayer.options = {
        ...newLayer.options,
        ...{ weight: DRAW_POLYGON_WEIGHT, color: DRAW_POLYGON_COLOR }
      };
      let polygon = newLayer.getLatLngs()[0].map(cord => [cord.lng, cord.lat]);
      polygon = [...polygon, polygon[0]];
      this.drawnItems.addLayer(newLayer, false);

      // *************************************************************************************
      // MAYBE MOVE THIS INTO componentDidUpdate?, no need for this logic in 2 places?
      const query = this._generateQuery(polygon);
      that.props.setQuery({
        query,
        value: JSON.stringify(polygon)
      });
      // *************************************************************************************
      that.setState({
        value: JSON.stringify(polygon)
      });
    });
  }

  componentDidUpdate() {
    if (this.props.value !== this.state.value) {
      if (this.props.value !== null) { // if the page loads with coordinates in the URL
        let polygon = JSON.parse(this.props.value);
        const query = this._generateQuery(polygon);
        this.props.setQuery({
          query,
          value: this.props.value
        });
      } else { // handles onClear (facets)
        this.drawnItems.clearLayers();
        this.props.setQuery({
          query: null,
          value: null
        });
      }

      this.setState({
        value: this.props.value
      });
    }
  }

  // client side event handlers
  _clearDatasets = () => this.drawnItems.clearLayers();
  _zoomHandler = () => localStorage.setItem('zoom', this.map.getZoom());
  _reRenderMap = () => this.map._onResize();
  _toggleMapDisplay = () => this.setState({ displayMap: !this.state.displayMap }, this._reRenderMap);

  // utility function to handle the data
  _generateQuery = (polygon) => ({
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
  });
  _switchCoordinates = (polygon) => (polygon.map((row) => [row[1], row[0]]));
  _transformData = (data) => { // transforms data for map
    const displayData = data.map(row => ({
      _id: row._id,
      _index: row._index,
      key: `${row._index}/${row._id}`,
      coordinates: this._switchCoordinates(row.location.coordinates[0]),
      center: [row.center.coordinates[1], row.center.coordinates[0]],
      image: `${row.urls[0]}/${row._id}.interferogram.browse_coarse.png`
    }));
    return displayData
  }

  _renderBbox = () => {
    // rendering pink bbox if not drawn and specified in facets (for page on load or backwards forwards on browser)
    const { value } = this.props;
    const drawnItems = this.drawnItems;

    if (drawnItems) {
      const numDrawn = this.drawnItems.getLayers().length;
      if (numDrawn === 0 && value) { // manually draw bounding box
        let coordinates = this._switchCoordinates(JSON.parse(value));
        let poly = L.polygon(coordinates, {
          color: DRAW_POLYGON_COLOR,
          weight: DRAW_POLYGON_WEIGHT,
          opacity: 0.5,
        });
        poly.addTo(drawnItems).addTo(this.map);
      }
    }
  }

  _renderDatasets = () => {
    const { data } = this.props;
    const layerGroup = this.layerGroup;

    if (layerGroup) {
      layerGroup.clearLayers(); // clearing all the previous datasets
      this._transformData(data).map(row => { // parsing data and rendering map
        let poly = L.polygon(row.coordinates, {
          fillOpacity: 0,
          weight: 1.3
        });
        poly.bindPopup(row._id).addTo(layerGroup).addTo(this.map);
      });
    }
  }


  render() {
    const { data, value } = this.props;
    const { displayMap } = this.state;

    this._renderBbox(); // rendering pink bbox
    this._renderDatasets(); // rendering dataset panes

    // find first occurance of valid center coordinate
    let validCenter = data.find(row => row.center.coordinates)
    if (validCenter) {
      const centerCoordinates = validCenter.center.coordinates;
      this.map.panTo(new L.LatLng(centerCoordinates[1], centerCoordinates[0]));
    }

    const mapStyle = {
      width: '95%',
      height: '59em',
      margin: '0 auto',
      marginBottom: '15px',
      display: displayMap ? 'block' : 'none'
    };

    return (
      <div className="reactive-map-container">
        <button onClick={this._toggleMapDisplay}>
          {displayMap ? 'Hide Map' : 'Show Map'}
        </button>
        <div id="leaflet-map-id" style={mapStyle} />
      </div>
    );
  }
}

export default class TestMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { componentId, data } = this.props;

    return (
      <ReactiveComponent
        componentId={componentId}
        URLParams={true}
        render={({ setQuery, value }) => {
          return (
            <MapComponent
              setQuery={setQuery}
              value={value}
              data={data}
            />
          );
        }}
      />
    );
  }
}
