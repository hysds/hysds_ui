import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { GenericButtonLink } from "../../components/Buttons";
import UserRulesTable from "../../components/UserRulesTable";
import {
  getUserRules,
  toggleUserRule,
  deleteUserRule
} from "../../redux/actions";

import HeaderBar from "../../components/HeaderBar";

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
      <div>
        <HeaderBar title="HySDS - User Rules" />
        <div className="user-rules-body">
          <div className="user-rules-options-wrapper">
            <GenericButtonLink href="/tosca/user-rule" label="Create Rule" />
          </div>

          <div className="user-rules-table-wrapper">
            <UserRulesTable
              rules={userRules}
              toggleUserRule={toggleUserRule}
              deleteUserRule={deleteUserRule}
              link="/tosca/user-rule"
            />
          </div>
        </div>
      </div>
    );
  }
};

ToscaUserRules.propTypes = {
  getUserRules: PropTypes.func.isRequired,
  userRules: PropTypes.array.isRequired
};

// redux state data
const mapStateToProps = state => ({
  userRules: state.toscaReducer.userRules
});

// Redux actions
const mapDispatchToProps = dispatch => ({
  getUserRules: () => dispatch(getUserRules())
});

export default connect(mapStateToProps, mapDispatchToProps)(ToscaUserRules);
