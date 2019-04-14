import React from 'react';
import { Route, Link, BrowserRouter as Router, Redirect } from 'react-router-dom'

import Tosca from './Tosca/index.jsx';
import MetadataViewer from './MetadataViewer/index.jsx';
import OnDemand from './OnDemand/index.jsx';
import OnDemandForm from '../components/OnDemandForm/index.jsx';


export default function Routes(props) {
  return (
    <Router>
      <div>
        <Route exact path='/' render={() => <Redirect to='/tosca' />} />
        <Route exact path='/tosca' component={Tosca} />
        <Route exact path='/tosca/metadata/:id' component={MetadataViewer} />
        {/* <Route exact path='/tosca/on-demand/:query' component={OnDemand} /> */}
        <Route exact path='/tosca/on-demand/:query' component={OnDemandForm} />
      </div>
    </Router>
  );
}
