import React from "react";
import { Helmet } from "react-helmet";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { ButtonLink } from "../../components/Buttons";
import UserRulesTable from "../../components/UserRulesTable";
import {
  getUserRules,
  toggleUserRule,
  deleteUserRule,
  globalSearchUserRules
} from "../../redux/actions";

import HeaderBar from "../../components/HeaderBar";

import "./style.css";

const ToscaUserRules = class extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      globalSearch: ""
    };
  }

  componentDidMount() {
    this.props.getUserRules();
  }

  _handleRuleSearch = e => {
    this.setState({
      globalSearch: e.target.value
    });
    this.props.globalSearchUserRules(e.target.value);
  };

  render() {
    const { userRules } = this.props;
    return (
      <div>
        <Helmet>
          <title>Tosca - User Rules</title>
          <meta name="description" content="Helmet application" />
        </Helmet>

        <HeaderBar title="HySDS - User Rules" />
        <div className="user-rules-body">
          <div className="user-rules-options-wrapper">
            <input
              className="user-rules-global-search"
              placeholder="Search..."
              onChange={this._handleRuleSearch}
              disabled={
                userRules.length === 0 && !this.state.globalSearch
                  ? true
                  : false
              }
            />
            <div className="user-rules-button-wrapper">
              <ButtonLink href="/tosca/user-rule" label="Create Rule" />
            </div>
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
  userRules: state.toscaReducer.filteredRules
});

// Redux actions
const mapDispatchToProps = dispatch => ({
  getUserRules: () => dispatch(getUserRules()),
  globalSearchUserRules: search => dispatch(globalSearchUserRules(search))
});

export default connect(mapStateToProps, mapDispatchToProps)(ToscaUserRules);
