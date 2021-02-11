import React, { Fragment } from "react"; // react imports
import ReactDOM from "react-dom";
import PropTypes from "prop-types";

import { connect } from "react-redux"; // redux
import {
  clickDatasetId,
  bboxEdit,
  unclickQueryRegion,
} from "../../redux/actions";

import { ReactiveComponent } from "@appbaseio/reactivesearch"; // reactivesearch

import L from "leaflet"; // lealfet
import "leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

import { Button } from "../Buttons";

import {
  LEAFLET_TILELAYER,
  LEAFLET_ATTRIBUTION,
  BBOX_COLOR,
  BBOX_WEIGHT,
  BBOX_OPACITY,
} from "../../config/tosca";

import "./style.scss";

let MapComponent = class extends React.Component {
  constructor(props) {
    super(props);

    this.mapId = "leaflet-map-id";
    let displayMap = localStorage.getItem("display-map");
    displayMap = displayMap === "false" ? false : true;

    this.state = {
      displayMap,
      value: props.bboxText,
    };
  }

  componentDidMount() {
    let center = window.localStorage.getItem("center");
    center = center ? JSON.parse(center) : [36.7783, -119.4179];

    // initializing the map
    this.map = L.map(this.mapId, {
      attributionControl: false,
      center,
      zoom: localStorage.getItem("zoom") || this.props.zoom,
      maxZoom: this.props.maxZoom,
      minZoom: this.props.minZoom,
      layers: [
        L.tileLayer(LEAFLET_TILELAYER, { attribution: LEAFLET_ATTRIBUTION }),
      ],
    });

    this.drawnItems = new L.FeatureGroup().addTo(this.map); // store all drawn boox's here
    this.layerGroup = L.layerGroup().addTo(this.map); // store all dataset panels in this layergroup

    this.shapeAttr = {
      color: BBOX_COLOR,
      weight: BBOX_WEIGHT,
      opacity: BBOX_OPACITY,
    };

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
          shapeOptions: this.shapeAttr,
        },
        rectangle: { shapeOptions: this.shapeAttr },
      },
    });
    this.map.addControl(this.drawControl);

    // map event handlers
    this.map.on("zoomend", this._zoomHandler);
    this.map.on(L.Draw.Event.DRAWSTART, this._clearBbox);
    this.map.on(L.Draw.Event.CREATED, this._handleMapDraw);
    this.map.on(L.Draw.Event.EDITED, this._handlePolygonEdit);

    // avoid additional "match_all" query on page load if initial bbox
    if (this.props.value) {
      let polygon = JSON.parse(this.props.value);
      const query = this._generateQuery(polygon);
      this.props.setQuery({ query, value: this.props.value });
      this.setState({ value: this.props.value });
    }
  }

  componentDidUpdate() {
    if (this.props.queryRegion) {
      this.props.unclickQueryRegion(); // avoid infinite loop

      let polygon = JSON.parse(this.props.bboxText);
      const query = this._generateQuery(polygon);
      this.props.setQuery({
        query,
        value: this.props.bboxText,
      });
      this.setState({ value: this.props.bboxText });
      return;
    }

    if (this.props.value !== this.state.value) {
      if (this.props.value !== null) {
        // if the page loads with coordinates in the URL
        let polygon = JSON.parse(this.props.value);
        const query = this._generateQuery(polygon);
        this.props.setQuery({
          query,
          value: this.props.value,
        });
      } else {
        this.sendEmptyQuery(); // handles onClear (facets)
      }
      this.setState({ value: this.props.value }); // prevent maximum recursion error
      this.props.bboxEdit(this.props.value);
    }
    this._renderBbox(); // rendering pink bbox
    this._renderDatasets(); // rendering dataset panes
  }

  _generateQuery = (polygon) => ({
    query: {
      bool: {
        filter: {
          geo_shape: {
            location: {
              shape: {
                type: "polygon",
                coordinates: [polygon],
              },
            },
          },
        },
      },
    },
  });

  sendEmptyQuery = () => {
    this.drawnItems.clearLayers();
    this.props.setQuery({
      query: null,
      value: null,
    });
    this.props.bboxEdit(null);
  };

  _handleMapDraw = (event) => {
    let newLayer = event.layer;
    let polygon = newLayer.getLatLngs()[0].map((cord) => [cord.lng, cord.lat]);
    polygon = [...polygon, polygon[0]];

    const query = this._generateQuery(polygon);
    const polygonString = JSON.stringify(polygon);

    this.props.setQuery({ query, value: polygonString }); // querying elasticsearch

    this.props.bboxEdit(polygonString);
    this.setState({ value: polygonString });
  };

  _handlePolygonEdit = (event) => {
    const layers = event.layers.getLayers();
    layers.map((layer) => {
      let polygon = layer.getLatLngs()[0].map((cord) => [cord.lng, cord.lat]);
      polygon = [...polygon, polygon[0]];

      const query = this._generateQuery(polygon);
      const polygonString = JSON.stringify(polygon);
      this.props.setQuery({ query, value: polygonString }); // querying elasticsearch

      this.props.bboxEdit(polygonString);
      this.setState({ value: polygonString });
    });
  };

  // client side event handlers
  _clearBbox = () => this.drawnItems.clearLayers();
  _zoomHandler = () => localStorage.setItem("zoom", this.map.getZoom());
  _reRenderMap = () => this.map._onResize();
  _toggleMapDisplay = () => {
    this.setState({ displayMap: !this.state.displayMap }, this._reRenderMap);
    localStorage.setItem("display-map", !this.state.displayMap);
  };

  _polygonTextChange = (e) => this.props.bboxEdit(e.target.value);

  _polygonTextInput = (e) => {
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
        this.props.setQuery({ query, value: polygonString });

        this.setState({ value: polygonString });
        this.props.bboxEdit(polygonString);
      } catch (err) {
        alert("Not valid JSON");
      }
    }
  };

  // utility function to handle the data
  _switchCoordinates = (polygon) => polygon.map((row) => [row[1], row[0]]);
  _validateRectangle = (coord) => {
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
      const poly = isRectangle
        ? L.rectangle(coordinates, this.shapeAttr)
        : L.polygon(coordinates, this.shapeAttr);
      poly.addTo(this.drawnItems).addTo(this.map);
    }
  };

  clickIdHandler = (_id) => this.props.clickDatasetId(_id); // send clicked _id to reducer

  _mapGeoJsonType = (t) => {
    const validTypes = [
      "Polygon",
      "MultiPolygon",
      "Point",
      "MultiPoint",
      "LineString",
      "MultiLineString",
    ];
    if (validTypes.indexOf(t) > -1) return t;

    const tLower = t.toLowerCase();
    if (tLower === "polygon") return "Polygon";
    else if (tLower === "multipolygon") return "MultiPolygon";
    else if (tLower === "point") return "Point";
    else if (tLower === "multipoint") return "MultiPoint";
    else if (tLower === "linestring") return "LineString";
    else if (tLower === "multilinestring") return "MultiLineString";
    else {
      console.warn(`${t} type not supported`);
      return null;
    }
  };

  _renderDatasets = () => {
    const { data } = this.props;

    if (this.layerGroup) {
      this.layerGroup.clearLayers(); // clearing all the previous datasets
      data.map((row) => {
        if (!row.location) return;
        const { type, coordinates } = row.location;
        const geoJsonType = this._mapGeoJsonType(type);

        if (!geoJsonType || !coordinates) return;
        location.type = geoJsonType;

        const geoJson = {
          type: geoJsonType,
          coordinates,
        };

        let layer;
        if (geoJsonType.includes("Point")) {
          const options = {
            radius: 4,
            weight: 1,
            opacity: 1,
            fillOpacity: 1,
          };
          layer = L.geoJSON(geoJson, {
            pointToLayer: (feature, latlng) => L.circleMarker(latlng, options),
          }).addTo(this.map);
        } else {
          const weight = geoJsonType.includes("LineString") ? 2.5 : 1.6;
          const options = { fillOpacity: 0, weight };
          layer = L.geoJSON(geoJson, options).addTo(this.map);
        }

        if (layer) {
          const popup = (
            <p
              className="id-popup-link"
              onClick={() => this.clickIdHandler(row._id)}
            >
              {row._id}
            </p>
          );
          let popupElement = document.createElement("div");
          ReactDOM.render(popup, popupElement);
          layer.bindPopup(popupElement).addTo(this.layerGroup).addTo(this.map);
        }
      });
    }
  };

  render() {
    const { data, bboxText } = this.props;
    const { displayMap } = this.state;

    // find first occurance of valid center coordinate
    let validCenter = data.find((row) =>
      row.center ? row.center.coordinates : null
    );
    if (validCenter && this.map) {
      let center = validCenter.center.coordinates;
      this.map.panTo(new L.LatLng(center[1], center[0]));
      localStorage.setItem("center", JSON.stringify([center[1], center[0]]));
    }

    const textboxTooltip =
      "Press SHIFT + ENTER to manually input polygon... \nex. [ [-125.09335, 42.47589], ... ,[-125.09335, 42.47589] ]";
    const mapStyle = { display: displayMap ? "block" : "none" };

    return (
      <Fragment>
        <Button
          label={displayMap ? "Hide Map" : "Show Map"}
          size="small"
          onClick={this._toggleMapDisplay}
        />

        <div className="leaflet-map-container" style={mapStyle}>
          <div id={this.mapId} className="leaflet-map" />
        </div>

        <textarea
          className="map-coordinates-textbox"
          placeholder={textboxTooltip}
          value={bboxText || this.props.value || ""}
          onChange={this._polygonTextChange}
          onKeyPress={this._polygonTextInput}
        ></textarea>
      </Fragment>
    );
  }
};

// Redux actions
const mapDispatchToProps = (dispatch) => ({
  clickDatasetId: (_id) => dispatch(clickDatasetId(_id)),
  bboxEdit: (bbox) => dispatch(bboxEdit(bbox)),
  unclickQueryRegion: () => dispatch(unclickQueryRegion()),
});

const mapStateToProps = (state) => ({
  bboxText: state.reactivesearchReducer.bboxText,
  queryRegion: state.reactivesearchReducer.queryRegion,
});

MapComponent = connect(mapStateToProps, mapDispatchToProps)(MapComponent);

const ReactiveMap = ({ componentId, data, zoom, maxZoom, minZoom }) => (
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

ReactiveMap.propTypes = {
  componentId: PropTypes.string.isRequired,
};

ReactiveMap.defaultProps = {
  zoom: 6,
  maxZoom: 10,
  minZoom: 0,
  data: [],
};

export default ReactiveMap;
