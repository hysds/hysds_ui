import React from "react";
import { Helmet } from "react-helmet";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { ButtonLink } from "../../components/Buttons";
import UserRulesTable from "../../components/UserRulesTable";

import { globalSearchUserRules } from "../../redux/actions";
import {
  getUserRules,
  toggleUserRule,
  deleteUserRule
} from "../../redux/actions/figaro";

import HeaderBar from "../../components/HeaderBar";

import "./style.scss";

const FigaroUserRules = class extends React.Component {
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
    const text = e.target.value;
    this.setState({
      globalSearch: text
    });
    this.props.globalSearchUserRules(text);
  };

  render() {
    const { darkMode, userRules } = this.props;
    const classTheme = darkMode ? "__theme-dark" : "__theme-light";
    const searchDisabled = userRules.length === 0 && !this.state.globalSearch;

    return (
      <div className={classTheme}>
        <Helmet>
          <title>Mozart - User Rules</title>
          <meta name="description" content="Helmet application" />
        </Helmet>
        <HeaderBar
          title="HySDS - User Rules"
          theme={classTheme}
          active="figaro"
        />

        <div className="user-rules-body">
          <div style={{ textAlign: "center" }}>
            <h1>Mozart - User Rules</h1>
          </div>
          <div className="user-rules-options-wrapper">
            <input
              className="user-rules-global-search"
              placeholder="Search..."
              onChange={this._handleRuleSearch}
              disabled={searchDisabled}
            />
            <div className="user-rules-button-wrapper">
              <ButtonLink href="/figaro/user-rule" label="Create Rule" />
            </div>
          </div>

          <div className="user-rules-table-wrapper">
            <UserRulesTable
              rules={userRules}
              toggleUserRule={toggleUserRule}
              deleteUserRule={deleteUserRule}
              link="/figaro/user-rule"
            />
          </div>
        </div>
      </div>
    );
  }
};

FigaroUserRules.propTypes = {
  getUserRules: PropTypes.func.isRequired,
  userRules: PropTypes.array.isRequired
};

// redux state data
const mapStateToProps = state => ({
  darkMode: state.themeReducer.darkMode,
  userRules: state.generalReducer.filteredRules
});

// Redux actions
const mapDispatchToProps = dispatch => ({
  getUserRules: () => dispatch(getUserRules()),
  globalSearchUserRules: search => dispatch(globalSearchUserRules(search))
});

export default connect(mapStateToProps, mapDispatchToProps)(FigaroUserRules);
