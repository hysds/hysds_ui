import React, { useState } from "react";
import PropTypes from "prop-types";

import { toLink, fileLocation } from "../../utils/workflow";

import "./style.css";

export function StatusBadge({ status }) {
  return (
    <span className={`wf-badge wf-state-${status || "unknown"}`}>
      {(status || "unknown").toUpperCase()}
    </span>
  );
}

export function Section({ title, count, defaultOpen, children }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="wf-section">
      <div className="wf-section-title" onClick={() => setOpen(!open)}>
        <span className="wf-caret">{open ? "▾" : "▸"}</span>
        {title}
        {count !== undefined && count !== null ? (
          <span className="wf-section-count"> ({count})</span>
        ) : null}
      </div>
      {open ? <div className="wf-section-body">{children}</div> : null}
    </div>
  );
}

Section.propTypes = {
  title: PropTypes.string.isRequired,
  count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  defaultOpen: PropTypes.bool,
};

const LIST_LIMIT = 10;

function Leaf({ value }) {
  const loc = fileLocation(value);
  const link = toLink(loc || value);
  if (link) {
    const label = loc || value;
    return (
      <a className="wf-link" href={link} target="_blank" rel="noopener noreferrer">
        {value && value.class ? `${value.class}: ` : ""}
        {label}
      </a>
    );
  }
  if (value === null || value === undefined) return <span className="wf-null">null</span>;
  if (typeof value === "string") return <span className="wf-str">{value}</span>;
  return <span className="wf-prim">{String(value)}</span>;
}

/**
 * Read-only tree for inputs/outputs. s3:// strings and File/Directory objects become links;
 * long lists show the first LIST_LIMIT items with a "show all" toggle.
 */
export function ValueView({ value, depth }) {
  const [all, setAll] = useState(false);
  const d = depth || 0;

  if (value && typeof value === "object" && !fileLocation(value)) {
    const isArray = Array.isArray(value);
    const entries = isArray ? value.map((v, i) => [i, v]) : Object.entries(value);
    if (entries.length === 0) return <span className="wf-null">{isArray ? "[]" : "{}"}</span>;
    const shown = all ? entries : entries.slice(0, LIST_LIMIT);
    return (
      <ul className="wf-tree">
        {shown.map(([k, v]) => (
          <li key={k}>
            <span className="wf-key">{k}:</span>{" "}
            <ValueView value={v} depth={d + 1} />
          </li>
        ))}
        {entries.length > LIST_LIMIT ? (
          <li>
            <a className="wf-link wf-show-all" onClick={() => setAll(!all)}>
              {all
                ? "show less"
                : `show all (${entries.length - LIST_LIMIT} more)`}
            </a>
          </li>
        ) : null}
      </ul>
    );
  }
  return <Leaf value={value} />;
}
