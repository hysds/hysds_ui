import React from "react";
import { connect } from "react-redux"; // redux
import { updateSearchQuery } from "../../redux/actions/index";
import { ReactiveComponent } from "@appbaseio/reactivesearch"; // reactivesearch

import "./style.css";

// wrapper component for ReactiveComponent
const SearchQuery = ({ componentId }) => (
  <ReactiveComponent
    componentId={componentId}
    URLParams={true}
    render={({ setQuery, value }) => (
      <SearchQueryHandler setQuery={setQuery} value={value} />
    )}
  />
);

class SearchQueryHandlerConnect extends React.Component {
  componentDidMount() {
    const { queryString } = this.props;

    if (!queryString) {
      this._sendEmptyQuery();
    } else {
      const query = SearchQueryHandlerConnect._generateQuery(queryString);
      this.props.setQuery({ query, value: queryString });
    }
  }

  static getDerivedStateFromProps(props, state) {
    const queryString = props.value;

    if (!queryString) {
      props.setQuery({ query: null, value: null });
    } else {
      if (queryString && !props.userTyping) {
        // page forward and backwards
        const query = SearchQueryHandlerConnect._generateQuery(props.value);
        props.setQuery({ query, value: props.value }); // sending query to elasticsearch
        const dispatchData = {
          queryString: props.value,
          userTyping: false
        };
        props.updateSearchQuery(dispatchData);
      }
    }
    return state;
  }

  static _generateQuery = searchQuery => ({
    query: {
      query_string: {
        query: searchQuery,
        default_operator: "OR"
      }
    }
  });

  _sendEmptyQuery = () => {
    this.props.setQuery({ query: null, value: null });
  };

  _handleSubmit = event => {
    event.preventDefault();
    const { queryString } = this.props;

    if (!queryString) {
      this._sendEmptyQuery();
    } else {
      const query = SearchQueryHandlerConnect._generateQuery(queryString);
      this.props.setQuery({ query, value: queryString }); // sending query to elasticsearch
      const dispatchData = {
        queryString,
        userTyping: false
      };
      this.props.updateSearchQuery(dispatchData);
    }
  };

  _handleChange = event => {
    const text = event.target.value;
    const dispatchData = {
      queryString: text,
      userTyping: true
    };
    this.props.updateSearchQuery(dispatchData);
  };

  render() {
    const { queryString } = this.props;
    return (
      <form className="query-input-form" onSubmit={this._handleSubmit}>
        <label>
          <input
            className="query-input-box"
            type="text"
            value={queryString || ""}
            onChange={this._handleChange}
          />
        </label>
      </form>
    );
  }
}

// redux state data
const mapStateToProps = state => ({
  queryString: state.reactivesearchReducer.queryString,
  userTyping: state.reactivesearchReducer.userTyping
});

// Redux actions
const mapDispatchToProps = dispatch => {
  return {
    updateSearchQuery: data => dispatch(updateSearchQuery(data)) // consists of queryString and userTyping
  };
};

const SearchQueryHandler = connect(
  mapStateToProps,
  mapDispatchToProps
)(SearchQueryHandlerConnect);

export default SearchQuery;
