import React from "react";
import PropTypes from "prop-types";

import { connect } from "react-redux";
import { editTheme } from "../../redux/actions";

import { Button } from "../Buttons";
import { Link } from "react-router-dom";

import "./style.scss";

const HeaderLink = props => {
  const { title, href, active } = props;

  let className = "header-bar-link";
  if (active) className = `${className} active-link`;

  return (
    <li className={className} {...props}>
      <Link to={props.href}>{title}</Link>
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
  const title = props.title || "HySDS";

  const _themeHandler = () => {
    const { darkMode } = props;
    props.editTheme(!darkMode);
    localStorage.setItem("dark-mode", !darkMode);
  };

  return (
    <div className="header-bar">
      <ul className="header-bar-link-wrapper">
        <HeaderTitle title={title} />
        <HeaderLink to="/tosca" title="Tosca" active={1} />
        <HeaderLink title="Figaro" />
        <Button
          label={props.darkMode ? "Light Mode" : "Dark Mode"}
          onClick={_themeHandler}
        />
        <div className="header-bar-buffer"></div>
        {/* <button>button</button> */}
        <li>
          <a>Logout</a>
        </li>
      </ul>
    </div>
  );
};

const mapStateToProps = state => ({
  darkMode: state.themeReducer.darkMode
});

const mapDispatchToProps = dispatch => ({
  editTheme: darkMode => dispatch(editTheme(darkMode))
});

export default connect(mapStateToProps, mapDispatchToProps)(HeaderBar);
