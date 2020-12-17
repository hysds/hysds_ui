import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux"; // redux

import { Link } from "react-router-dom";

import { clickQueryRegion } from "../../redux/actions";
import UserTags from "../UserTags";
import { Button } from "../Buttons";

import { GRQ_REST_API_V1 } from "../../config";

import "./style.scss";

const ToscaDataViewer = (props) => {
  const { res } = props;
  const endpoint = `${GRQ_REST_API_V1}/grq/user-tags`;

  let userTags =
    res.metadata && res.metadata.user_tags ? res.metadata.user_tags : [];

  const clickQueryRegion = () => {
    const bbox = JSON.stringify(res.location.coordinates[0]);
    props.clickQueryRegion(bbox);
  };

  let browseUrl = null;
  if (res.urls) browseUrl = res.urls.find((url) => url.startsWith("http"));

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
      <a href={browseUrl} />
      {browseUrl ? (
        <a href={browseUrl} target="_blank">
          Browse
        </a>
      ) : null}
      <span />
      <Link
        className="tosca-metadata-link"
        to={`/tosca/metadata/${res._index}/${res._id}`}
        target="_none"
      >
        Metadata
      </Link>
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
