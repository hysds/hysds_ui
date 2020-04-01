import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux"; // redux
import { clickDatasetId } from "../../redux/actions";
import { ReactiveComponent } from "@appbaseio/reactivesearch"; // reactivesearch

var Handler = class extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      _id: props._id
    };
  }

  componentDidMount() {
    const { value } = this.props;
    if (value) {
      const query = this._generateQuery(value);
      this.props.setQuery({
        query,
        value
      });
    }
  }

  _generateQuery = _id => ({
    query: {
      term: { _id }
    }
  });

  _sendEmptyQuery = () => {
    this.props.setQuery({ query: null, value: null });
    this.setState({ _id: null });
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
      }
    } else if (this.props._id !== this.props.value) {
      // this is to handle page forwards and backwards
      if (this.props.value) {
        const query = this._generateQuery(this.props.value);
        this.props.setQuery({ query, value: this.props.value });
      } else {
        this._sendEmptyQuery();
      }
      this.props.clickDatasetId(this.props.value);
      this.setState({ _id: this.props.value });
    }
  }
  render = () => <Fragment />;
};

// Redux states and actions
const mapStateToProps = state => ({
  _id: state.reactivesearchReducer._id
});

const mapDispatchToProps = dispatch => ({
  clickDatasetId: _id => dispatch(clickDatasetId(_id))
});

Handler = connect(mapStateToProps, mapDispatchToProps)(Handler);

const IdQueryHandler = ({ componentId }) => {
  return (
    <ReactiveComponent
      componentId={componentId}
      URLParams={true}
      render={({ setQuery, value }) => (
        <Handler setQuery={setQuery} value={value} componentId={componentId} />
      )}
    />
  );
};

IdQueryHandler.propTypes = {
  componentId: PropTypes.string.isRequired
};

export default IdQueryHandler;
