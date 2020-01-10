import React from "react";
import { Link } from "react-router-dom";

import "font-awesome/css/font-awesome.min.css";
import "./style.scss";

import upArrow from "../../images/arrow-up.png";

export const Button = props => {
  let { label, size, color, loading } = props;

  label = loading ? <i className="fa fa-spinner fa-spin"></i> : label;

  var colorClass;
  switch (color) {
    case "success":
      colorClass = "button-success";
      break;
    case "fail":
      colorClass = "button-fail";
      break;
    case "warning":
      colorClass = "button-warning";
      break;
    default:
      colorClass = "button-basic";
  }

  var sizeClass;
  switch (size) {
    case "small":
      sizeClass = "button-small";
      break;
    case "large":
      sizeClass = "button-large";
      break;
    default:
      sizeClass = "button";
  }

  return (
    <button className={`${sizeClass} ${colorClass}`} {...props}>
      {label || "Button"}
    </button>
  );
};

export const ButtonLink = props => (
  <Link to={props.href} target={props.target}>
    <Button {...props} />
  </Link>
);

export const ScrollTop = props => (
  <img src={upArrow} className="scroll-top-button" {...props} />
);

export const ToggleButton = props => {
  let label = props.enabled ? "On" : "Off";
  label = props.loading ? <i className="fa fa-spinner fa-spin"></i> : label;

  const style = {
    background: props.enabled ? "#5cb85c" : "#dc3545"
  };

  return (
    <button
      className="user-rules-table-button"
      style={style}
      disabled={props.loading}
      {...props}
    >
      {label}
    </button>
  );
};

export const DeleteButton = props => {
  let label = props.label || "Delete";
  label = props.loading ? <i className="fa fa-spinner fa-spin"></i> : label;
  return (
    <button
      className="user-rules-table-button delete"
      disabled={props.loading}
      {...props}
    >
      {label}
    </button>
  );
};

export const EditButton = props => {
  let label = props.label || "Edit";
  label = props.loading ? <i className="fa fa-spinner fa-spin"></i> : label;
  return (
    <button className="user-rules-table-button edit" {...props}>
      {label}
    </button>
  );
};
