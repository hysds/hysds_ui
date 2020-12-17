import React, { useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux"; // redux

import { Link } from "react-router-dom";
import ReactJson from "react-json-view";

import { clickQueryRegion } from "../../redux/actions";
import UserTags from "../UserTags";
import { Button } from "../Buttons";

import { GRQ_REST_API_V1 } from "../../config";

import { darkthemealt, lightthemebg } from "../../scss/constants.scss";
import "./style.scss";

const ToscaDataViewer = (props) => {
  const { res } = props;
  const [viewData, setViewData] = useState(false);

  const endpoint = `${GRQ_REST_API_V1}/grq/user-tags`;

  let userTags =
    res.metadata && res.metadata.user_tags ? res.metadata.user_tags : [];

  const metadataTheme = props.darkMode ? "monokai" : "rjv-default";
  const backgroundColor = props.darkMode ? darkthemealt : lightthemebg;

  let browseUrl = null;
  if (res.urls) browseUrl = res.urls.find((url) => url.startsWith("http"));

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
      <UserTags
        tags={userTags}
        endpoint={endpoint}
        index={res._index}
        id={res._id}
      />
      {browseUrl ? (
        <a className="tosca-browse-link" href={browseUrl} target="_blank">
          Browse
        </a>
      ) : null}
      <span />
      <a
        href="javascript:void(0)"
        className="tosca-metadata-link"
        onClick={() => setViewData(!viewData)}
      >
        Preview Metadata
      </a>
      <Link
        className="tosca-metadata-link"
        to={`/tosca/metadata/${res._index}/${res._id}`}
        target="_none"
      >
        Full Metadata
      </Link>
      {viewData ? (
        <div className="tosca-metadata-preview">
          <ReactJson
            src={res}
            displayDataTypes={false}
            theme={metadataTheme}
            style={{ backgroundColor }}
            displayObjectSize={false}
          />
        </div>
      ) : null}
    </div>
  );
};

// Redux actions
const mapDispatchToProps = (dispatch) => ({
  clickQueryRegion: (bbox) => dispatch(clickQueryRegion(bbox)),
});

ToscaDataViewer.propTypes = {
  res: PropTypes.object.isRequired,
};

export default connect(null, mapDispatchToProps)(ToscaDataViewer);
