import React from "react";
import PropTypes from "prop-types";

import "font-awesome/css/font-awesome.min.css";
import "./style.css";

import upArrow from "../../images/arrow-up.png";

export const OnDemandButton = ({ query, total }) => (
  <a
    className="utility-button"
    href={`/tosca/on-demand?query=${query}&total=${total}`}
    target="on-demand-tosca"
  >
    On Demand
  </a>
);

export const TriggerRulesButton = props => (
  <a className="utility-button" href={props.link} {...props}>
    Trigger Rules
  </a>
);

export const ScrollTop = () => (
  <img
    src={upArrow}
    className="scroll-top-button"
    onClick={() => window.scrollTo(0, 0)}
  />
);

export const SubmitButton = props => {
  const className = props.disabled
    ? "submit-button disabled"
    : "submit-button active";

  let label = props.label || "Submit";
  label = props.loading ? <i className="fa fa-spinner fa-spin"></i> : label;

  return (
    <button
      className={className}
      disabled={props.disabled || props.loading}
      {...props}
    >
      {label}
    </button>
  );
};

export const QueryCheckerButton = props => {
  let className = "query-checker-button";
  if (props.disabled) className = `${className} disabled`;

  const label = props.loading ? (
    <i className="fa fa-spinner fa-spin"></i>
  ) : (
    label
  );
  return (
    <button className={className} disabled={props.disabled} {...props}>
      Data Count Check
    </button>
  );
};

export const ToggleButton = props => {
  let label = props.enabled ? "On" : "Off";
  label = props.loading ? <i className="fa fa-spinner fa-spin"></i> : label;

  const style = {
    background: props.enabled ? "#5cb85c" : "#dc3545"
  };

  return (
    <button className="toggle-button" style={style} {...props}>
      {label}
    </button>
  );
};

export const DeleteButton = props => {
  let label = props.label || "Delete";
  label = props.loading ? <i className="fa fa-spinner fa-spin"></i> : label;
  return (
    <button className="delete-button" {...props}>
      {label}
    </button>
  );
};

export const EditButton = props => {
  let label = props.label || "Edit";
  label = props.loading ? <i className="fa fa-spinner fa-spin"></i> : label;
  return (
    <button className="edit-button" {...props}>
      {label}
    </button>
  );
};
