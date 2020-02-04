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
import ToscaRuleEditor from "../pages/ToscaRuleEditor";

import Figaro from "./Figaro";
import FigaroOnDemand from "./FigaroOnDemand";
import FigaroUserRules from "../pages/FigaroUserRules";

const Routes = () => {
  let router = (
    <Router>
      <Switch>
        <Route exact path="/" render={() => <Redirect to="/tosca" />} />

        <Route exact path="/tosca" component={Tosca} />
        <Route exact path="/tosca/metadata" component={MetadataViewer} />
        <Route exact path="/tosca/on-demand" component={ToscaOnDemand} />
        <Route exact path="/tosca/user-rules" component={ToscaUserRules} />
        <Route exact path="/tosca/user-rule" component={ToscaRuleEditor} />
        <Route
          exact
          path="/tosca/user-rule/:rule"
          component={ToscaRuleEditor}
        />

        <Route exact path="/figaro" component={Figaro} />
        <Route exact path="/figaro/on-demand" component={FigaroOnDemand} />
        <Route exact path="/figaro/user-rules" component={FigaroUserRules} />
      </Switch>
    </Router>
  );
  return router;
};

export default Routes;
