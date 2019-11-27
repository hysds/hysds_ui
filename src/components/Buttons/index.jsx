import React from "react";

import "font-awesome/css/font-awesome.min.css";
import "./style.css";

import upArrow from "../../images/arrow-up.png";

export const OnDemandButton = ({ query, total }) => (
  <a
    className="utility-button"
    href={`/tosca/on-demand?query=${query}&total=${total}`}
    target="_blank"
  >
    On Demand
  </a>
);

export const TriggerRulesButton = () => (
  <a className="utility-button" href="#">
    Trigger Rules (Work in Progress)
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
      disabled={props.disabled || props.loading}
      className={className}
      {...props}
    >
      {label}
    </button>
  );
};
