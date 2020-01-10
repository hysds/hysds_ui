import React from "react";
import { Link } from "react-router-dom";

import "font-awesome/css/font-awesome.min.css";
import "./style.css";
import "./style.scss";

import upArrow from "../../images/arrow-up.png";

export const SimpleButton = props => {
  const label = props.label || "Button";
  return (
    <button className="simple-button" {...props}>
      {label}
    </button>
  );
};

export const GenericButtonLink = props => {
  let label = props.label || "Button";
  return (
    <Link to={props.href}>
      <button className="generic-button" {...props}>
        {label}
      </button>
    </Link>
  );
};

export const OnDemandButton = ({ query, total }) => (
  <a
    className="utility-button"
    href={`/tosca/on-demand?query=${query}&total=${total}`}
    target="on-demand-tosca"
  >
    On Demand
  </a>
);

export const TriggerRulesButton = props => {
  let label = props.label || "Trigger Rules";
  return (
    <a className="trigger-rules-button" href={props.link} {...props}>
      {label}
    </a>
  );
};

export const ScrollTop = props => (
  <img src={upArrow} className="scroll-top-button" {...props} />
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
    <button
      className="toggle-button"
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
    <button className="delete-button" disabled={props.loading} {...props}>
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
