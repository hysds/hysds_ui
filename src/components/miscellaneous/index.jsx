import React, { Fragment } from "react";
import "font-awesome/css/font-awesome.min.css";
import "./style.css";

export const Border = () => <hr className="job-param-border" />;

export const SubmitStatusBar = props => {
  const label = props.label || "Please input label";

  const status = props.status === "failed" ? "failed" : "success";
  const visible = props.visible ? "status-visible" : "status-hidden";

  const className = `job-submit-status-bar ${visible} ${status}`;

  return (
    <div className={className} {...props}>
      <div className="job-submit-status-bar-label">{label}</div>
      {props.reason ? (
        <div className="job-submit-status-bar-sublabel">{props.reason}</div>
      ) : null}
    </div>
  );
};

export const HelperLink = props => {
  return (
    <Fragment>
      <a href={props.link} target="_none" className="helper-link">
        <i className="fa fa-info"></i>
      </a>
    </Fragment>
  );
};

export const Checkbox = props => (
  <Fragment>
    <input className="miscellaneous-checkbox" type="checkbox" {...props} />
  </Fragment>
);
