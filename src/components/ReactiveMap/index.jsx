import React, { Fragment } from "react"; // react imports
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux"; // redux
import { clickDatasetId } from "../../redux/actions/index";
import { ReactiveComponent } from "@appbaseio/reactivesearch"; // reactivesearch
import L from "leaflet"; // lealfet
import "leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "./style.css";
import ReactTooltip from "react-tooltip"; // UI stuff

import {
  LEAFLET_TILELAYER,
  LEAFLET_ATTRIBUTION,
  BBOX_COLOR,
  BBOX_WEIGHT,
  BBOX_OPACITY
} from "../../config.js";

let ConnectMapComponent = class extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      displayMap: true,
      value: null,
      polygonTextbox: props.value
    };
  }

  componentDidMount() {
    // initializing the map
    this.map = L.map("leaflet-map-id", {
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
      if (this.props.value !== null) {
        // if the page loads with coordinates in the URL
        let polygon = JSON.parse(this.props.value);
        const query = this._generateQuery(polygon);
        this.props.setQuery({
          query,
          value: this.props.value
        });
      } else this.sendEmptyQuery(); // handles onClear (facets)

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
      coordinates:
        !!row.location && !!row.location.coordinates
          ? this._switchCoordinates(row.location.coordinates[0])
          : [],
      center: row.center
        ? [row.center.coordinates[1], row.center.coordinates[0]]
        : [],
      image: row.urls
        ? `${row.urls[0]}/${row._id}.interferogram.browse_coarse.png`
        : null
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

  clickIdHandler = _id => this.props.clickDatasetId(_id); // send clicked _id to reducer

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
          <div>
            <p
              className="id-popup-link"
              onClick={this.clickIdHandler.bind(this, row._id)}
            >
              {row._id}
            </p>
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
    let validCenter = data.find(row =>
      row.center ? row.center.coordinates : null
    );
    if (validCenter) {
      const center = validCenter.center.coordinates;
      this.map.panTo(new L.LatLng(center[1], center[0]));
    }

    const textboxTooltip = `Press SHIFT + ENTER to manually input polygon... ex. [ [-125.09335, 42.47589], ... ,[-125.09335, 42.47589] ]`;

    let storedMapHeight = localStorage.getItem("map-height");
    const mapContainerStyle = {
      minHeight: 500,
      height: storedMapHeight ? `${storedMapHeight}px` : 500,
      marginTop: "10px",
      marginLeft: "10px",
      marginRight: "10px",
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

// Redux actions
const mapDispatchToProps = dispatch => ({
  clickDatasetId: _id => dispatch(clickDatasetId(_id))
});

const MapComponent = connect(null, mapDispatchToProps)(ConnectMapComponent);

const ReactiveMap = ({ componentId, data, zoom, maxZoom, minZoom }) => {
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
};

ReactiveMap.propTypes = {
  componentId: PropTypes.string.isRequired
};

ReactiveMap.defaultProps = {
  zoom: 6,
  maxZoom: 10,
  minZoom: 0,
  data: []
};

export default ReactiveMap;
