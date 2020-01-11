import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux"; // redux
import { clickQueryRegion } from "../../redux/actions";

import { Button } from "../Buttons";

import "./style.css";

const ToscaDataViewer = props => {
  const { res } = props;

  const clickQueryRegion = () => {
    const bbox = JSON.stringify(res.location.coordinates[0]);
    props.clickQueryRegion(bbox);
  };

  return (
    <div className="tosca-data-viewer">
      <div>id: {res._id}</div>
      {res.location && res.location.coordinates ? (
        <Button size="small" label="Query Region" onClick={clickQueryRegion} />
      ) : null}
    </div>
  );
};

// Redux actions
const mapDispatchToProps = dispatch => ({
  clickQueryRegion: bbox => dispatch(clickQueryRegion(bbox))
});

export default connect(null, mapDispatchToProps)(ToscaDataViewer);
