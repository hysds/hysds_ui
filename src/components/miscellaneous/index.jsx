import React from "react";
import "./style.css";

export const Border = () => <hr className="job-param-border" />;

export const SubmitStatusBar = props => {
  const label = props.label || "Please input label";

  const status = props.status === "failed" ? "failed" : "success";
  const visible = props.visible ? "status-visible" : "status-hidden";

  const className = `job-submit-status-bar ${visible} ${status}`;

  return (
    <div className={className} {...props}>
      {label}
    </div>
  );
};
