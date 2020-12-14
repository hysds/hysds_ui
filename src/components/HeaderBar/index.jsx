import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { editTheme } from "../../redux/actions";
import { Button } from "../Buttons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";

import {
  MOZART_REST_API_V1,
  GRQ_REST_API_V1,
  KIBANA_URL,
  RABBIT_MQ_PORT,
} from "../../config";

import styles from "../../scss/constants.scss";
import "./style.scss";

export const HeaderLink = (props) => {
  const { title, href, active } = props;

  let className = "header-bar-link";
  if (active) className = `${className} active-link`;

  return (
    <li className={className} {...props}>
      <Link to={{ pathname: href, state: "desiredState" }}>{title}</Link>
    </li>
  );
};

export const HeaderTitle = (props) => {
  let title = props.title || "HySDS";
  return (
    <li className="header-bar-title" {...props}>
      <a>{title}</a>
    </li>
  );
};

export const DropdownSources = () => (
  <div className="link-dropdown">
    <button className="link-dropbtn">
      <span className="header-source-title">Sources</span>{" "}
      <FontAwesomeIcon icon={faCaretDown} />
    </button>
    <div className="link-dropdown-content">
      <a href={MOZART_REST_API_V1} target="_blank">
        Mozart Rest API
      </a>
      <a href={GRQ_REST_API_V1} target="_blank">
        GRQ Rest API
      </a>
      <a href={KIBANA_URL} target="_blank">
        Metrics (Kibana)
      </a>
      <a
        href={`${window.location.protocol}//${window.location.hostname}:${RABBIT_MQ_PORT}`}
        target="_blank"
      >
        RabbitMQ
      </a>
    </div>
  </div>
);

const HeaderBar = (props) => {
  let { title, theme } = props;
  title = props.title || "HySDS";

  const _themeHandler = () => {
    const { darkMode } = props;
    props.editTheme(!darkMode);
    localStorage.setItem("dark-mode", !darkMode);
    if (!darkMode)
      localStorage.setItem("background-color", styles.darkthemebackground);
    else localStorage.setItem("background-color", styles.lightthemebackground);
  };

  return (
    <div className={`${theme} header-bar`}>
      <ul className="header-bar-link-wrapper">
        <HeaderTitle title={title} />
        {props.children}
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
  theme: "__theme-light",
};

const mapStateToProps = (state) => ({
  darkMode: state.themeReducer.darkMode,
});

const mapDispatchToProps = (dispatch) => ({
  editTheme: (darkMode) => dispatch(editTheme(darkMode)),
});

export default connect(mapStateToProps, mapDispatchToProps)(HeaderBar);
