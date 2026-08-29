import React from "react";
import PropTypes from "prop-types";

import { formatUtc } from "../../utils";

import "./style.css";

/**
 * Shown above a results list when its last query failed. The previous results stay on
 * screen on purpose -- operators can keep reading them -- but they are labelled stale so
 * nobody mistakes them for the result of the filter they just changed.
 *
 * The error reaches us from several layers, so unwrap whichever shape turned up:
 * an Elasticsearch error object, a rejected fetch Response, a JS Error, or the raw
 * _msearch body when every sub-query failed.
 */
export function describeSearchError(error) {
  if (!error) return null;
  if (typeof error === "string") return error;

  if (error.responses) {
    const failed = error.responses.filter((r) => r && r.error);
    if (failed.length) return describeSearchError(failed[0].error);
  }

  const cause = error.root_cause && error.root_cause[0];
  if (cause && cause.reason) return `${cause.type}: ${cause.reason}`;
  if (error.reason) return error.type ? `${error.type}: ${error.reason}` : error.reason;

  // a rejected fetch Response
  if (typeof error.status === "number" && (error.statusText !== undefined || error.url))
    return `HTTP ${error.status}${error.statusText ? ` ${error.statusText}` : ""}`;

  if (error.message) return error.message;

  try {
    return JSON.stringify(error);
  } catch (e) {
    return String(error);
  }
}

function SearchErrorBanner({ error, staleSince }) {
  const detail = describeSearchError(error);

  return (
    <div className="search-error-banner">
      <div className="search-error-banner-label">
        Search failed &mdash; your filter change was NOT applied.
      </div>
      <div className="search-error-banner-help">
        {staleSince
          ? `The results below are the previous ones, from ${formatUtc(
              staleSince,
              true
            )}. They do not match the filters shown above.`
          : "The results below do not match the filters shown above."}{" "}
        Adjust a filter (or re-click the same one) to retry.
      </div>
      {detail ? (
        <details className="search-error-banner-details">
          <summary>details</summary>
          <pre>{detail}</pre>
        </details>
      ) : null}
    </div>
  );
}

SearchErrorBanner.propTypes = {
  error: PropTypes.any,
  staleSince: PropTypes.number,
};

export default SearchErrorBanner;
