import React, { Fragment, useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";

import ReactJson from "react-json-view";

import HeaderBar from "../../components/HeaderBar";

import { GRQ_ES_URL } from "../../config";

import { darkthemebg, lightthemebg } from "../../scss/constants.scss";
import "./style.scss";

const MetadataViewer = (props) => {
  const { id, index } = props.match.params;
  const classTheme = props.darkMode ? "__theme-dark" : "__theme-light";

  const endpoint = `${GRQ_ES_URL}/${index}/_doc/${id}`;
  const [metadata, setMetadata] = useState({});

  useEffect(() => {
    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => setMetadata(data))
      .catch((err) => console.error(err));
  }, []);

  const theme = props.darkMode ? "monokai" : "rjv-default";
  const backgroundColor = props.darkMode ? darkthemebg : lightthemebg;

  return (
    <Fragment>
      <Helmet>
        <title>GRQ - Metadata</title>
      </Helmet>
      <HeaderBar title="GRQ - Metadata" theme={classTheme} />

      <div className={classTheme}>
        <div className="metadata-view-container">
          <ReactJson
            src={metadata}
            displayDataTypes={false}
            theme={theme}
            style={{ backgroundColor: backgroundColor }}
            displayObjectSize={false}
          />
        </div>
      </div>
    </Fragment>
  );
};

const mapStateToProps = (state) => ({
  darkMode: state.themeReducer.darkMode,
});

export default connect(mapStateToProps)(MetadataViewer);
