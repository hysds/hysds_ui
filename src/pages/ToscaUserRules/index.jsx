import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import UserRulesTable from "../../components/UserRulesTable";
import {
  getUserRules,
  toggleUserRule,
  deleteUserRule
} from "../../redux/actions";

import "./style.css";

const ToscaUserRules = class extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.getUserRules();
  }

  render() {
    const { userRules } = this.props;
    return (
      <Fragment>
        <UserRulesTable
          rules={userRules}
          toggleUserRule={toggleUserRule}
          deleteUserRule={deleteUserRule}
          link="/tosca/user-rule"
        />
      </Fragment>
    );
  }
};

// redux state data
const mapStateToProps = state => ({
  userRules: state.toscaReducer.userRules,
  toggle: state.toscaReducer.state
});

// Redux actions
const mapDispatchToProps = dispatch => ({
  getUserRules: () => dispatch(getUserRules())
});

export default connect(mapStateToProps, mapDispatchToProps)(ToscaUserRules);
