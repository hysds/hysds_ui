import React from 'react';
import PropTypes from 'prop-types';
import { ReactiveComponent } from '@appbaseio/reactivesearch';

export default class IDQueryHandler extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { componentId } = this.props;
    return (
      <ReactiveComponent
        componentId={componentId}
        // render={({setQuery, value}) => {}}
      >
      </ReactiveComponent>
    );
  }
}

let LogicHandler = class extends React.Component {
  
}
