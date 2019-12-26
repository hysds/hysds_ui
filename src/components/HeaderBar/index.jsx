import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

import "./style.css";

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
  return (
    <div className="header-bar">
      <ul className="header-bar-link-wrapper">
        <HeaderTitle title={title} />
        <HeaderLink to="/tosca" title="Tosca" active={1} />
        <HeaderLink title="Figaro" />
        <HeaderLink style={{ flex: 1 }} />

        <li>
          <a>Logout</a>
        </li>
      </ul>
    </div>
  );
};

export default HeaderBar;
