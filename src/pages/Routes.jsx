import React, { Fragment } from "react";
import {
  Route,
  // Link,
  BrowserRouter as Router,
  Redirect
} from "react-router-dom";

import Tosca from "./Tosca";
import MetadataViewer from "./MetadataViewer";
import ToscaOnDemand from "../pages/ToscaOnDemand";

const style = {
  // width: "100%",
  background: "#4387ff",
  color: "#ffff",
  display: "flex",
  padding: 10
};

export default function Routes(props) {
  let router = (
    <Fragment>
      <div style={style}>
        <div style={{ flex: 1, paddingLeft: 5, paddingRight: 5 }}>Tosca</div>
        <div style={{ flex: 0, paddingLeft: 5, paddingRight: 5 }}>stuff</div>
        <div style={{ flex: 0, paddingLeft: 5, paddingRight: 5 }}>stuff</div>
        <div style={{ flex: 0, paddingLeft: 5, paddingRight: 5 }}>stuff</div>
      </div>
      <Router>
        <Route exact path="/" render={() => <Redirect to="/tosca" />} />
        <Route exact path="/tosca" component={Tosca} />
        <Route exact path="/tosca/metadata" component={MetadataViewer} />
        <Route exact path="/tosca/on-demand" component={ToscaOnDemand} />
      </Router>
    </Fragment>
  );
  return router;
}
