import React from "react";
import { Route, BrowserRouter as Router, Redirect } from "react-router-dom";

import Tosca from "./Tosca";
import MetadataViewer from "./MetadataViewer";
import ToscaOnDemand from "../pages/ToscaOnDemand";
import UserRulesViewer from "../pages/UserRulesViewer";

const Routes = () => {
  let router = (
    <Router>
      <Route exact path="/" render={() => <Redirect to="/tosca" />} />
      <Route exact path="/tosca" component={Tosca} />
      <Route exact path="/tosca/metadata" component={MetadataViewer} />
      <Route exact path="/tosca/on-demand" component={ToscaOnDemand} />
      <Route exact pathh="/tosca/user-rules" component={UserRulesViewer} />
    </Router>
  );
  return router;
};

export default Routes;
