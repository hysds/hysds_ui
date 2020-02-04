import React from "react";
import PropTypes from "prop-types";

import { connect } from "react-redux";
import { clearReduxStore, editTheme } from "../../redux/actions";

import { Button } from "../Buttons";
import { Link } from "react-router-dom";

import "./style.scss";

const HeaderLink = props => {
  const { title, href, active } = props;

  let className = "header-bar-link";
  if (active) className = `${className} active-link`;

  return (
    <li className={className} {...props}>
      <a to={href} {...props}>
        {title}
      </a>
    </li>
  );
};

const HeaderTitle = props => {
  let title = props.title || "HySDS";
  return (
    <li className="header-bar-title" {...props}>
      <a>{title}</a>
    </li>
  );
};

const HeaderBar = props => {
  let { title, theme } = props;
  title = props.title || "HySDS";

  const _themeHandler = () => {
    const { darkMode } = props;
    props.editTheme(!darkMode);
    localStorage.setItem("dark-mode", !darkMode);
  };

  const _handleLinkClick = e => {
    if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
    props.clearReduxStore();
  };

  return (
    <div className={`${theme} header-bar`}>
      <ul className="header-bar-link-wrapper">
        <HeaderTitle title={title} />
        <HeaderLink
          href="/tosca"
          title="Tosca"
          onClick={_handleLinkClick}
          active={props.active === "tosca" ? 1 : 0}
        />
        <HeaderLink
          href="/figaro"
          title="Figaro"
          onClick={_handleLinkClick}
          active={props.active === "figaro" ? 1 : 0}
        />
        <Button
          label={props.darkMode ? "Light Mode" : "Dark Mode"}
          onClick={_themeHandler}
        />
        <div className="header-bar-buffer"></div>
        <li>
          <a>Logout</a>
        </li>
      </ul>
    </div>
  );
};

HeaderBar.defaultProps = {
  theme: "__theme-light"
};

const mapStateToProps = state => ({
  darkMode: state.themeReducer.darkMode
});

const mapDispatchToProps = dispatch => ({
  clearReduxStore: () => dispatch(clearReduxStore()),
  editTheme: darkMode => dispatch(editTheme(darkMode))
});

export default connect(mapStateToProps, mapDispatchToProps)(HeaderBar);
