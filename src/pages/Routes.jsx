import React from "react";
import {
  Route,
  BrowserRouter as Router,
  Switch,
  Redirect
} from "react-router-dom";

import Tosca from "./Tosca";
import MetadataViewer from "./MetadataViewer";
import ToscaOnDemand from "../pages/ToscaOnDemand";
import ToscaUserRules from "../pages/ToscaUserRules";
import ToscaUserRuleEditor from "../pages/ToscaUserRuleEditor";

const Routes = () => {
  let router = (
    <Router>
      <Switch>
        <Route exact path="/" render={() => <Redirect to="/tosca" />} />
        <Route exact path="/tosca" component={Tosca} />
        <Route exact path="/tosca/metadata" component={MetadataViewer} />
        <Route exact path="/tosca/on-demand" component={ToscaOnDemand} />
        <Route exact path="/tosca/user-rules" component={ToscaUserRules} />
        <Route exact path="/tosca/user-rule" component={ToscaUserRuleEditor} />
        <Route
          exact
          path="/tosca/user-rule/:rule"
          component={ToscaUserRuleEditor}
        />
      </Switch>
    </Router>
  );
  return router;
};

export default Routes;
