import React from "react";
import {
  Route,
  // Link,
  BrowserRouter as Router,
  Redirect
} from "react-router-dom";

import Tosca from "./Tosca";
import MetadataViewer from "./MetadataViewer";
import ToscaOnDemand from "../pages/ToscaOnDemand";

export default function Routes(props) {
  let router = (
    <Router>
      <Route exact path="/" render={() => <Redirect to="/tosca" />} />
      <Route exact path="/tosca" component={Tosca} />
      <Route exact path="/tosca/metadata" component={MetadataViewer} />
      <Route exact path="/tosca/on-demand" component={ToscaOnDemand} />
    </Router>
  );
  return router;
}
