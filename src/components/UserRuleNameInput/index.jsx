import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import "./style.css";

const UserRuleNameInput = props => {
  const { ruleName } = props;
  const editRuleName = e => props.editRuleName(e.target.value);

  return (
      <div className="user-rule-input-wrapper">
        <div className="user-rule-input-label">Rule Name:</div>
        <input
          type="text"
          placeholder="Required"
          name="tag"
          onChange={editRuleName}
          value={ruleName || ""}
          className="user-rule-input"
          required
        />
      </div>
  );
};

UserRuleNameInput.propTypes = {
  editRuleName: PropTypes.func.isRequired
};

UserRuleNameInput.defaultProps = {
  url: false
};

// Redux actions
const mapDispatchToProps = (dispatch, ownProps) => {
  const { url, editRuleName } = ownProps;
  return {
    editRuleName: tag => dispatch(editRuleName(tag, url))
  };
};

export default connect(null, mapDispatchToProps)(UserRuleNameInput);
