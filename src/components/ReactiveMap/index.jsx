import React, { Fragment } from 'react';
import { renderToString } from 'react-dom/server';
import ReactDOM, { hydrate } from 'react-dom';
import PropTypes from 'prop-types';
import { ReactiveComponent } from '@appbaseio/reactivesearch';
import ReactTooltip from 'react-tooltip'
import L from 'leaflet';
import 'leaflet-draw';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './style.css';

import { LEAFLET_TILELAYER, LEAFLET_ATTRIBUTION, DEFAULT_MAP_DISPLAY } from '../../config.js';

const DRAW_POLYGON_COLOR = '#f06eaa';
const DRAW_POLYGON_WEIGHT = 7;

let MapComponent = class extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      displayMap: DEFAULT_MAP_DISPLAY,
      value: null,
      polygonTextbox: props.value,
    };
    this._toggleMapDisplay = this._toggleMapDisplay.bind(this);
    this._polygonTextChange = this._polygonTextChange.bind(this);
    this._polygonTextInput = this._polygonTextInput.bind(this);
    this._handleMapDraw = this._handleMapDraw.bind(this);
    this._handleMapSizeChange = this._handleMapSizeChange.bind(this);
  }

  componentDidMount() {
    this.map = L.map('leaflet-map-id', { // initializing the map
      attributionControl: false,
      center: [36.7783, -119.4179],
      zoom: localStorage.getItem('zoom') || this.props.zoom,
      maxZoom: this.props.maxZoom,
      minZoom: this.props.minZoom,
      layers: [L.tileLayer(LEAFLET_TILELAYER, { attribution: LEAFLET_ATTRIBUTION })]
    });

    this.drawnItems = new L.FeatureGroup().addTo(this.map); // store all drawn boox's here
    this.layerGroup = L.layerGroup().addTo(this.map);  // store all dataset panels in this layergroup

    this.drawControl = new L.Control.Draw({
      shapeOptions: {
        showArea: true,
        clickable: true
      },
      edit: {
        featureGroup: this.drawnItems,
        remove: false,
        edit: false,
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
    this.map.addControl(this.drawControl);

    // map event handlers
    this.map.on('zoomend', this._zoomHandler);
    this.map.on('draw:drawstart', this._clearDatasets);
    this.map.on('draw:created', this._handleMapDraw);
  }

  componentDidUpdate() {
    if (this.props.value !== this.state.value) { // prevent maximum recursion error
      if (this.props.value !== null) { // if the page loads with coordinates in the URL
        let polygon = JSON.parse(this.props.value);
        const query = this._generateQuery(polygon);
        this.props.setQuery({
          query,
          value: this.props.value
        });
      } else { // handles onClear (facets)
        this.sendEmptyQuery();
      }

      this.setState({
        value: this.props.value,  // prevent maximum recursion error
        polygonTextbox: this.props.value
      });
    }
  }

  _handleMapDraw = (event) => {
    let newLayer = event.layer;
    let polygon = newLayer.getLatLngs()[0].map(cord => [cord.lng, cord.lat]);
    polygon = [...polygon, polygon[0]];

    const query = this._generateQuery(polygon);
    const polygonString = JSON.stringify(polygon);

    this.props.setQuery({
      query,
      value: polygonString
    });
    this.setState({
      value: polygonString,
      polygonTextbox: polygonString,
    });
  }

  // client side event handlers
  _clearDatasets = () => this.drawnItems.clearLayers();
  _zoomHandler = () => localStorage.setItem('zoom', this.map.getZoom());
  _reRenderMap = () => this.map._onResize();
  _toggleMapDisplay = () => this.setState({ displayMap: !this.state.displayMap }, this._reRenderMap);
  _polygonTextChange = (e) => {
    this.setState({
      polygonTextbox: e.target.value
    });
  }
  _polygonTextInput = (e) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      try {
        const polygonString = e.target.value;
        if (polygonString.trim() === '') {
          this.sendEmptyQuery();
          return;
        };

        let polygon = JSON.parse(polygonString);
        const query = this._generateQuery(polygon);

        this.props.setQuery({
          query,
          value: polygonString
        });
        this.setState({
          value: polygonString,
          polygonTextbox: polygonString,
        });
      } catch (err) {
        alert('Not valid JSON');
      }
    }
  }

  _generateQuery = (polygon) => ({
    query: {
      "bool": {
        "filter": {
          "geo_shape": {
            "location": {
              "shape": { "type": "polygon", "coordinates": [polygon] }
            }
          }
        }
      }
    }
  });

  sendEmptyQuery = () => { // remove the bbox facet
    this.drawnItems.clearLayers();
    this.props.setQuery({
      query: null,
      value: null
    });
    this.setState({
      polygonTextbox: null
    });
  }

  // utility function to handle the data
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

    if (drawnItems && value) {
      drawnItems.clearLayers();
      let coordinates = this._switchCoordinates(JSON.parse(value));
      let poly = L.polygon(coordinates, {
        color: DRAW_POLYGON_COLOR,
        weight: DRAW_POLYGON_WEIGHT,
        opacity: 0.5,
      });
      poly.addTo(drawnItems).addTo(this.map);
    }
  }

  _testEvent = (_id) => {
    console.log('FINALLY GOT THIS SHIT WORKING', _id);
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
        const popup = (<div onClick={this._testEvent.bind(this, row._id)}>{row._id}</div>);
        let popupElement = document.createElement('div');
        ReactDOM.render(popup, popupElement);
        poly.bindPopup(popupElement).addTo(layerGroup).addTo(this.map);
      });
    }
  }

  _handleMapSizeChange = (e) => {
    this.map.invalidateSize();
    localStorage.setItem('map-container-height', this.mapContainer.clientHeight);
  }

  render() {
    const { data } = this.props;
    const { displayMap, polygonTextbox } = this.state;

    this._renderBbox(); // rendering pink bbox
    this._renderDatasets(); // rendering dataset panes

    // find first occurance of valid center coordinate
    let validCenter = data.find(row => row.center.coordinates)
    if (validCenter) {
      const centerCoordinates = validCenter.center.coordinates;
      this.map.panTo(new L.LatLng(centerCoordinates[1], centerCoordinates[0]));
    }

    const textboxTooltip = `Press SHIFT + ENTER to manually input polygon... ex. [ [-125.09335, 42.47589], ... ,[-125.09335, 42.47589] ]`;

    let storedMapHeight = localStorage.getItem('map-container-height');
    const mapContainerStyle = {
      minHeight: 500,
      height: storedMapHeight ? `${storedMapHeight}px` : 500,
      margin: '10px',
      overflow: 'auto',
      resize: 'vertical',
      display: displayMap ? 'block' : 'none',
    };

    return (
      <div>
        <button onClick={this._toggleMapDisplay}>
          {displayMap ? 'Hide Map' : 'Show Map'}
        </button>
        <div
          onMouseUp={this._handleMapSizeChange}
          style={mapContainerStyle}
          ref={(input) => { this.mapContainer = input; }}
        >
          <div id="leaflet-map-id" className="leaflet-map" />
        </div>

        <ReactTooltip place="top" type="dark" effect="solid" />
        <textarea
          className="map-coordinates-textbox"
          placeholder={textboxTooltip}
          data-tip={textboxTooltip}  // react tool tip
          value={polygonTextbox || ''}
          onChange={this._polygonTextChange}
          onKeyPress={this._polygonTextInput}
        >
        </textarea>
      </div>
    );
  }
}

export default class ReactiveMap extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { componentId, data, zoom, maxZoom, minZoom } = this.props;

    return (
      <ReactiveComponent
        componentId={componentId}
        URLParams={true}
        render={({ setQuery, value }) => (
          <MapComponent
            setQuery={setQuery}
            value={value}
            data={data}
            zoom={zoom}
            maxZoom={maxZoom}
            minZoom={minZoom}
          />
        )}
      />
    );
  }
}

ReactiveMap.propTypes = {
  componentId: PropTypes.string.isRequired,
  // clickIdHandler: PropTypes.func.isRequired,
};

ReactiveMap.defaultProps = {
  zoom: 6,
  maxZoom: 10,
  minZoom: 0,
  data: []
};
