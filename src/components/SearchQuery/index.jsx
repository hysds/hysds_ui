import React, { Fragment } from "react";
import { connect } from "react-redux"; // redux
import { updateSearchQuery } from "../../redux/actions";
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
  constructor(props) {
    super(props);
    this.state = {
      queryString: props.queryString || props.value
    };
  }

  componentDidMount() {
    const { queryString } = this.props;

    if (!queryString) this._sendEmptyQuery();
    else {
      const query = this._generateQuery(queryString);
      this.props.setQuery({ query, value: queryString });
    }
  }

  // TODO: need to clean this logic up
  componentDidUpdate() {
    const { queryString } = this.props;

    if (!this.props.userTyping) {
      if (this.props.queryString !== this.state.queryString) {
        if (!this.state.queryString) {
          const query = this._generateQuery(this.props.queryString);
          this.props.setQuery({ query, value: queryString });
          this.setState({ queryString });
        } else {
          this._sendEmptyQuery(); // clearing _id facet
          this.setState({ queryString: null });
        }
      } else if (this.props.queryString !== this.props.value) {
        // handle page forwards and backwards
        if (this.props.value) {
          // page moves to non-empty query_string
          const query = this._generateQuery(this.props.value);
          this.props.setQuery({ query, value: this.props.value });
        } else {
          // page moves to empty query_string
          this._sendEmptyQuery();
          this.setState({ queryString: null });
        }
        const dispatchData = {
          queryString: this.props.value,
          userTyping: false
        };
        this.props.updateSearchQuery(dispatchData);
        this.setState({ queryString: this.props.value });
      }
    }
  }

  _generateQuery = searchQuery => ({
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

    if (!queryString) this._sendEmptyQuery();
    else {
      const query = this._generateQuery(queryString);
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
      <Fragment>
        <form className="query-input-form" onSubmit={this._handleSubmit}>
          <input
            className="query-input-box"
            type="text"
            value={queryString || ""}
            onChange={this._handleChange}
            placeholder={`Input Elasticsearch query string... ex. _id:"test_id"`}
          />
        </form>
      </Fragment>
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
