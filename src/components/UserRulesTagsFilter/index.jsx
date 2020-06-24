import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import Select from "react-select";

import styles from "../../scss/constants.scss";

const UserRulesTagsFilter = (props) => {
  const { tag, tags, darkMode } = props;

  const backgroundColor = darkMode
    ? styles.darkthemelight
    : styles.lightthemebackground;

  const color = darkMode ? styles.darkthemecolor : styles.lightthemecolor;

  const theme = (base) => {
    return darkMode
      ? {
          ...base,
          colors: {
            ...base.colors,
            primary: styles.darkthemebackground,
            primary25: styles.darkthemebackground,
            primary50: styles.darkthemebackground,
          },
        }
      : { ...base };
  };

  const selectStyles = {
    container: (base) => ({
      ...base,
      padding: "0px 15px 0px 15px",
      flexGrow: 0,
      flexShrink: 0,
      flexBasis: "30%",
    }),
    control: (base) => ({
      ...base,
      backgroundColor: backgroundColor,
      borderColor: darkMode ? backgroundColor : base.borderColor,
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: backgroundColor,
      color: color,
    }),
    singleValue: (base) => ({
      ...base,
      color: color,
    }),
    input: (base) => ({
      ...base,
      color: color,
    }),
  };

  return (
    <Select
      theme={theme}
      styles={selectStyles}
      options={tags}
      placeholder="Tags..."
      onChange={(e) => props.changeUserRuleTagsFilter(e.value)}
      value={tag ? { value: tag, label: tag } : null}
    />
  );
};

UserRulesTagsFilter.propTypes = {
  tags: PropTypes.array.isRequired,
  changeUserRuleTagsFilter: PropTypes.func.isRequired,
};

UserRulesTagsFilter.defaultProps = {
  tags: [],
  darkMode: false,
};

// Redux actions
const mapDispatchToProps = (dispatch, ownProps) => {
  const { changeUserRuleTagsFilter } = ownProps;
  return {
    changeUserRuleTagsFilter: (e) => dispatch(changeUserRuleTagsFilter(e)),
  };
};

export default connect(null, mapDispatchToProps)(UserRulesTagsFilter);
