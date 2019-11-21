import React, { Fragment } from "react";

import OnDemandQueryEditor from "../../components/OnDemandQueryEditor/index.jsx";
import OnDemandJobSubmitter from "../../components/OnDemandJobSubmitter/index.jsx";

import { connect } from "react-redux";
import { editOnDemandQuery, editOnDemandPriority } from "../../redux/actions";

import "./style.css";

class ToscaOnDemand extends React.Component {
  render() {
    let { query } = this.props;

    return (
      <Fragment>
        <div className="split on-demand-left">
          <OnDemandQueryEditor
            query={query}
            editOnDemandQuery={editOnDemandQuery} // redux action
          />
        </div>

        <div className="split on-demand-right">
          <div className="on-demand-subitter-wrapper">
            <OnDemandJobSubmitter editOnDemandPriority={editOnDemandPriority} />
          </div>
        </div>
      </Fragment>
    );
  }
}

const mapStateToProps = state => ({
  query: state.toscaReducer.onDemandQuery
});

export default connect(mapStateToProps, null)(ToscaOnDemand);
