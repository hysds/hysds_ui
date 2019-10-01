import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { ReactiveComponent } from "@appbaseio/reactivesearch";

export default class IDQueryHandler extends React.Component {
  render() {
    const { componentId } = this.props;
    return (
      <ReactiveComponent
        componentId={componentId}
        URLParams={true}
        render={({ setQuery, value, selectedValue }) => (
          <LogicHandler
            setQuery={setQuery}
            value={value}
            _id={this.props._id}
          />
        )}
      ></ReactiveComponent>
    );
  }
}

let LogicHandler = class extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props._id
    };
  }

  _generateQuery = _id => ({
    query: {
      term: {
        _id: _id
      }
    }
  });

  _sendEmptyQuery = () => {
    this.props.setQuery({
      query: null,
      value: null
    });
    this.setState({
      value: null
    });
  };

  componentDidUpdate() {
    // let x = this.props._id || this.props.value;
    // if (this.state.value !== x) {
    //   if (x !== null) {
    //     const query = this._generateQuery(x);
    //     this.props.setQuery({
    //       query,
    //       value: x,
    //     });
    //   } else {
    //     this._sendEmptyQuery();
    //   }
    //   this.setState({
    //     value: x,
    //   });
    // }
  }

  render() {
    return <Fragment />;
  }
};
