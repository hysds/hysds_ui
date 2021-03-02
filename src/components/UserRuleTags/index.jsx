import React, { Fragment } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import { Creatable } from "react-select";

import "./style.scss";

const UserRuleTags = (props) => {
  const value = props.value.map((tag) => ({
    value: tag,
    label: tag,
  }));

  const onChange = (e, v) => {
    if (v.action === "create-option") {
      const newRule = e[e.length - 1];
      if (!newRule.value.trim()) return;
    }
    props.changeUserRuleTag(e);
  };

  return (
    <Fragment>
      <section className="job-input-wrapper">
        <label className="job-input-label">Tags:</label>
        <div className="job-input-select-wrapper">
          <Creatable
            isMulti
            onChange={onChange}
            value={value}
            options={props.options}
          />
        </div>
      </section>
    </Fragment>
  );
};

UserRuleTags.propTypes = {
  value: PropTypes.array.isRequired,
  options: PropTypes.array.isRequired,
  changeUserRuleTag: PropTypes.func.isRequired,
};

UserRuleTags.defaultProps = {
  tags: [],
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const { changeUserRuleTag } = ownProps;
  return {
    changeUserRuleTag: (tag) => dispatch(changeUserRuleTag(tag)),
  };
};

export default connect(null, mapDispatchToProps)(UserRuleTags);
