import React, { Fragment } from "react";
import OnDemandJsonEditor from "../../components/OnDemandJsonEditor/index.jsx";
import { connect } from "react-redux";

import "./style.css";

class ToscaOnDemand extends React.Component {
  render() {
    let { query } = this.props;

    try {
      query = JSON.parse(query);
      query = query.query;
      query = JSON.stringify(query, null, 2);
    } catch (err) {
      console.error(err);
    }

    return (
      <Fragment>
        <div className="split on-demand-left">
          <OnDemandJsonEditor query={query} />
        </div>

        <div className="split on-demand-right">Dropdowns</div>
      </Fragment>
    );
  }
}

const mapStateToProps = state => ({
  query: state.toscaReducer.onDemandQuery
});

export default connect(mapStateToProps, null)(ToscaOnDemand);
