import React from "react";

import { faInfo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { formatUtc } from "../../utils";

import "./style.css";

export function Border() {
  return <hr className="job-param-border" />;
}

export function SubmitStatusBar(props) {
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
}

export function HelperLink(props) {
  return (
    <>
      <a href={props.link} target="_blank" className="helper-link">
        <FontAwesomeIcon icon={faInfo} />
      </a>
    </>
  );
}

// `time` is the epoch-ms of the last successful results response, so the banner tracks
// when the data on screen actually arrived -- not when a request went out. Shown in UTC to
// match the job and dataset timestamps in the results (HC-551).
export function LastUpdatedAtBanner({ time }) {
  if (!time) return null;
  return (
    <div className="last-updated-banner">
      <span>Last Updated: {formatUtc(time)}</span>
    </div>
  );
}
