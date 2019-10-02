import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux"; // redux
import { ReactiveComponent } from "@appbaseio/reactivesearch"; // reactivesearch

export default class IDQueryHandler extends React.Component {
  render() {
    const { componentId } = this.props;
    return (
      <ReactiveComponent
        componentId={componentId}
        URLParams={true}
        render={({ setQuery, value }) => (
          <LogicHandler setQuery={setQuery} value={value} />
        )}
      ></ReactiveComponent>
    );
  }
}

const mapStateToProps = state => {
  return {
    articles: state.articles,
    _id: state._id
  };
};

const ConnectLogicHandler = class extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      _id: props._id
    };

    if (props._id) {
      const query = this._generateQuery(this.props._id);
      props.setQuery({ query, value: props._id });
    }
  }

  _generateQuery = _id => ({
    query: {
      term: { _id }
    }
  });

  _sendEmptyQuery = () => {
    this.props.setQuery({ query: null, value: null });
    this.setState({ value: null });
  };

  componentDidUpdate() {
    const { _id } = this.props;

    if (this.props._id !== this.state._id) {
      if (!this.state._id) {
        const query = this._generateQuery(this.props._id);
        this.props.setQuery({ query, value: _id });
        this.setState({ _id });
      } else {
        this._sendEmptyQuery(); // clearing _id facet
        this.setState({ _id: null });
      }
    }
  }

  render() {
    return <Fragment />;
  }
};

const LogicHandler = connect(mapStateToProps)(ConnectLogicHandler);
