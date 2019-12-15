import React, { Fragment } from "react";
import { connect } from "react-redux";

import QueryEditor from "../../components/QueryEditor";

import { getUserRule, editQuery, validateQuery } from "../../redux/actions";

class ToscaUserRuleEditor extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const params = this.props.match.params;
    if (params.rule) this.props.getUserRule(params.rule);
  }

  render() {
    console.log(this.props);
    return (
      <Fragment>
        <h1>{this.props.match.params.rule}</h1>
        <QueryEditor
          editQuery={editQuery}
          validateQuery={validateQuery}
          query={this.props.query}
        />
      </Fragment>
    );
  }
}

// redux state data
const mapStateToProps = state => ({
  userRules: state.toscaReducer.userRules,
  query: state.toscaReducer.query
});

// Redux actions
const mapDispatchToProps = (dispatch, ownProps) => ({
  getUserRule: id => dispatch(getUserRule(id))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ToscaUserRuleEditor);
