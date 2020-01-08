import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux"; // redux
import { clickQueryRegion } from "../../redux/actions";

import { SimpleButton } from "../Buttons";

const ToscaDataViewer = props => {
  const res = props.res;

  const clickQueryRegion = () => {
    const bbox = JSON.stringify(res.location.coordinates[0]);
    props.clickQueryRegion(bbox);
  };

  return (
    <div style={{ border: "1px solid black", padding: 10, margin: 10 }}>
      <div>id: {res._id}</div>
      {res.location && res.location.coordinates ? (
        <SimpleButton label="Query Region" onClick={clickQueryRegion} />
      ) : null}
    </div>
  );
};

// Redux actions
const mapDispatchToProps = dispatch => ({
  clickQueryRegion: bbox => dispatch(clickQueryRegion(bbox))
});

export default connect(null, mapDispatchToProps)(ToscaDataViewer);
