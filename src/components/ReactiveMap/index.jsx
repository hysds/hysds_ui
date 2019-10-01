import React, { Fragment } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import { ReactiveComponent } from "@appbaseio/reactivesearch";
import ReactTooltip from "react-tooltip";
import L from "leaflet";
import "leaflet-draw";

import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "./style.css";

import {
  LEAFLET_TILELAYER,
  LEAFLET_ATTRIBUTION,
  DEFAULT_MAP_DISPLAY
} from "../../config.js";

const BBOX_COLOR = "#f06eaa";
const BBOX_WEIGHT = 5;
const BBOX_OPACITY = 0.3;

let MapComponent = class extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      displayMap: DEFAULT_MAP_DISPLAY,
      value: null,
      polygonTextbox: props.value
    };
  }

  componentDidMount() {
    this.map = L.map("leaflet-map-id", {
      // initializing the map
      attributionControl: false,
      center: [36.7783, -119.4179],
      zoom: localStorage.getItem("zoom") || this.props.zoom,
      maxZoom: this.props.maxZoom,
      minZoom: this.props.minZoom,
      layers: [
        L.tileLayer(LEAFLET_TILELAYER, { attribution: LEAFLET_ATTRIBUTION })
      ]
    });

    this.drawnItems = new L.FeatureGroup().addTo(this.map); // store all drawn boox's here
    this.layerGroup = L.layerGroup().addTo(this.map); // store all dataset panels in this layergroup

    this.drawControl = new L.Control.Draw({
      shapeOptions: { showArea: true, clickable: true },
      edit: { featureGroup: this.drawnItems, remove: false },
      draw: {
        circle: false,
        marker: false,
        polyline: false,
        circlemarker: false,
        polygon: {
          allowIntersection: false,
          shapeOptions: {
            color: BBOX_COLOR,
            weight: BBOX_WEIGHT,
            opacity: BBOX_OPACITY
          }
        },
        rectangle: {
          shapeOptions: {
            color: BBOX_COLOR,
            weight: BBOX_WEIGHT,
            opacity: BBOX_OPACITY
          }
        }
      }
    });
    this.map.addControl(this.drawControl);

    // map event handlers
    this.map.on("zoomend", this._zoomHandler);
    this.map.on(L.Draw.Event.DRAWSTART, this._clearBbox);
    this.map.on(L.Draw.Event.CREATED, this._handleMapDraw);
    this.map.on(L.Draw.Event.EDITED, this._handlePolygonEdit);
  }

  componentDidUpdate() {
    if (this.props.value !== this.state.value) {
      // prevent maximum recursion error
      if (this.props.value !== null) {
        // if the page loads with coordinates in the URL
        let polygon = JSON.parse(this.props.value);
        const query = this._generateQuery(polygon);
        this.props.setQuery({
          query,
          value: this.props.value
        });
      } else {
        // handles onClear (facets)
        this.sendEmptyQuery();
      }

      this.setState({
        value: this.props.value, // prevent maximum recursion error
        polygonTextbox: this.props.value
      });
    }

    this._renderBbox(); // rendering pink bbox
    this._renderDatasets(); // rendering dataset panes
  }

  _handleMapDraw = event => {
    let newLayer = event.layer;
    let polygon = newLayer.getLatLngs()[0].map(cord => [cord.lng, cord.lat]);
    polygon = [...polygon, polygon[0]];

    const query = this._generateQuery(polygon);
    const polygonString = JSON.stringify(polygon);

    this.props.setQuery({ query, value: polygonString }); // querying elasticsearch
    this.setState({ value: polygonString, polygonTextbox: polygonString });
  };

  _handlePolygonEdit = event => {
    const layers = event.layers.getLayers();
    layers.map(layer => {
      let polygon = layer.getLatLngs()[0].map(cord => [cord.lng, cord.lat]);
      polygon = [...polygon, polygon[0]];

      const query = this._generateQuery(polygon);
      const polygonString = JSON.stringify(polygon);

      this.props.setQuery({ query, value: polygonString }); // querying elasticsearch
      this.setState({ value: polygonString, polygonTextbox: polygonString });
    });
  };

  // client side event handlers
  _clearBbox = () => this.drawnItems.clearLayers();
  _zoomHandler = () => localStorage.setItem("zoom", this.map.getZoom());
  _reRenderMap = () => this.map._onResize();
  _toggleMapDisplay = () =>
    this.setState({ displayMap: !this.state.displayMap }, this._reRenderMap);
  _polygonTextChange = e => this.setState({ polygonTextbox: e.target.value });

  _polygonTextInput = e => {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      try {
        const polygonString = e.target.value;
        if (polygonString.trim() === "") {
          this.sendEmptyQuery();
          return;
        }

        let polygon = JSON.parse(polygonString);
        const query = this._generateQuery(polygon);

        this.props.setQuery({
          query,
          value: polygonString
        });
        this.setState({
          value: polygonString,
          polygonTextbox: polygonString
        });
      } catch (err) {
        alert("Not valid JSON");
      }
    }
  };

  _generateQuery = polygon => ({
    query: {
      bool: {
        filter: {
          geo_shape: {
            location: {
              shape: { type: "polygon", coordinates: [polygon] }
            }
          }
        }
      }
    }
  });

  sendEmptyQuery = () => {
    // remove the bbox facet
    this.drawnItems.clearLayers();
    this.props.setQuery({
      query: null,
      value: null
    });
    this.setState({
      polygonTextbox: null
    });
  };

  // utility function to handle the data
  _switchCoordinates = polygon => polygon.map(row => [row[1], row[0]]);
  _transformData = data => {
    // transforms data for map
    const displayData = data.map(row => ({
      _id: row._id,
      _index: row._index,
      key: `${row._index}/${row._id}`,
      coordinates: this._switchCoordinates(row.location.coordinates[0]),
      center: [row.center.coordinates[1], row.center.coordinates[0]],
      image: `${row.urls[0]}/${row._id}.interferogram.browse_coarse.png`
    }));
    return displayData;
  };

  _validateRectangle = coord => {
    if (
      coord.length === 5 &&
      coord[0][0] === coord[3][0] &&
      coord[1][0] === coord[2][0] &&
      coord[0][1] === coord[1][1] &&
      coord[2][1] === coord[3][1]
    )
      return true;
    return false;
  };

  _renderBbox = () => {
    const { value } = this.props;

    if (this.drawnItems && value) {
      this.drawnItems.clearLayers();
      let coordinates = this._switchCoordinates(JSON.parse(value));
      const isRectangle = this._validateRectangle(coordinates); // checking valid rectangle
      const drawOptions = {
        color: BBOX_COLOR,
        weight: BBOX_WEIGHT,
        opacity: BBOX_OPACITY
      };
      const poly = isRectangle
        ? L.rectangle(coordinates, drawOptions)
        : L.polygon(coordinates, drawOptions);
      poly.addTo(this.drawnItems).addTo(this.map);
    }
  };

  _renderDatasets = () => {
    const { data } = this.props;

    if (this.layerGroup) {
      this.layerGroup.clearLayers(); // clearing all the previous datasets
      this._transformData(data).map(row => {
        // parsing data and rendering map
        let poly = L.polygon(row.coordinates, {
          fillOpacity: 0,
          weight: 1.3
        });
        const popup = (
          <div onClick={this.props.clickIdHandler.bind(this, row._id)}>
            {row._id}
          </div>
        );
        let popupElement = document.createElement("div");
        ReactDOM.render(popup, popupElement);
        poly
          .bindPopup(popupElement)
          .addTo(this.layerGroup)
          .addTo(this.map);
      });
    }
  };

  _handleMapSizeChange = e => {
    this.map.invalidateSize();
    localStorage.setItem("map-height", this.mapContainer.clientHeight);
  };

  render() {
    const { data } = this.props;
    const { displayMap, polygonTextbox } = this.state;

    // find first occurance of valid center coordinate
    let validCenter = data.find(row => row.center.coordinates);
    if (validCenter) {
      const center = validCenter.center.coordinates;
      this.map.panTo(new L.LatLng(center[1], center[0]));
    }

    const textboxTooltip = `Press SHIFT + ENTER to manually input polygon... ex. [ [-125.09335, 42.47589], ... ,[-125.09335, 42.47589] ]`;

    let storedMapHeight = localStorage.getItem("map-height");
    const mapContainerStyle = {
      minHeight: 500,
      height: storedMapHeight ? `${storedMapHeight}px` : 500,
      margin: "10px",
      overflow: "auto",
      resize: "vertical",
      display: displayMap ? "block" : "none"
    };
    const mapStyle = { display: displayMap ? "block" : "none" };

    return (
      <Fragment>
        <button onClick={this._toggleMapDisplay}>
          {displayMap ? "Hide Map" : "Show Map"}
        </button>
        <div
          onMouseUp={this._handleMapSizeChange}
          style={mapContainerStyle}
          ref={input => (this.mapContainer = input)}
        >
          <div style={mapStyle} id="leaflet-map-id" className="leaflet-map" />
        </div>

        <ReactTooltip place="top" type="dark" effect="solid" />
        <textarea
          className="map-coordinates-textbox"
          placeholder={textboxTooltip}
          data-tip={textboxTooltip} // react tool tip
          value={polygonTextbox || ""}
          onChange={this._polygonTextChange}
          onKeyPress={this._polygonTextInput}
        ></textarea>
      </Fragment>
    );
  }
};

export default class ReactiveMap extends React.Component {
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
            clickIdHandler={this.props.clickIdHandler}
          />
        )}
      />
    );
  }
}

ReactiveMap.propTypes = {
  componentId: PropTypes.string.isRequired,
  clickIdHandler: PropTypes.func.isRequired
};

ReactiveMap.defaultProps = {
  zoom: 6,
  maxZoom: 10,
  minZoom: 0,
  data: []
};
