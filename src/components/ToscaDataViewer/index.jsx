import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux"; // redux
import { clickQueryRegion } from "../../redux/actions";
import UserTags from "../UserTags";

import { Button } from "../Buttons";

import "./style.scss";

const ToscaDataViewer = (props) => {
  const { res } = props;

  const clickQueryRegion = () => {
    const bbox = JSON.stringify(res.location.coordinates[0]);
    props.clickQueryRegion(bbox);
  };

  return (
    <div key={`${res._index}-${res._id}`} className="tosca-data-viewer">
      <div>id: {res._id}</div>
      {res["@timestamp"] ? (
        <div>ingest timestamp: {res["@timestamp"]}</div>
      ) : null}
      {res.location && res.location.coordinates ? (
        <Button size="small" label="Query Region" onClick={clickQueryRegion} />
      ) : null}
      <UserTags />
    </div>
  );
};

// Redux actions
const mapDispatchToProps = (dispatch) => ({
  clickQueryRegion: (bbox) => dispatch(clickQueryRegion(bbox)),
});

export default connect(null, mapDispatchToProps)(ToscaDataViewer);
