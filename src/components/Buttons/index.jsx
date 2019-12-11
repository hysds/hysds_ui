import React from "react";

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

export const SubmitOnDemandJobButton = props => {
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
