import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux"; // redux
import { clickDatasetId } from "../../redux/actions";
import { ReactiveComponent } from "@appbaseio/reactivesearch"; // reactivesearch

class ConnectLogicHandler extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      _id: props._id
    };
  }

  componentDidMount() {
    const { _id } = this.props;
    if (_id) {
      const query = this._generateQuery(_id);
      this.props.setQuery({ query, value: _id });
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

  /**
   * TODO: clean up this logic
   * const _id = this.props._id || this.props.value
   */
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
}

// Redux states and actions
const mapStateToProps = state => ({
  _id: state.reactivesearchReducer._id
});

const mapDispatchToProps = dispatch => ({
  clickDatasetId: _id => dispatch(clickDatasetId(_id))
});

const LogicHandler = connect(
  mapStateToProps,
  mapDispatchToProps
)(ConnectLogicHandler);

const IdQueryHandler = ({ componentId }) => {
  return (
    <ReactiveComponent
      componentId={componentId}
      URLParams={true}
      render={({ setQuery, value }) => (
        <LogicHandler
          setQuery={setQuery}
          value={value}
          componentId={componentId}
        />
      )}
    ></ReactiveComponent>
  );
};

IdQueryHandler.propTypes = {
  componentId: PropTypes.string.isRequired
};

export default IdQueryHandler;
