import React from "react";
import PropTypes from "prop-types";

import { summarizeStatuses } from "../../utils/workflow";

import "../WorkflowCommon/style.css";
import "./style.css";

export const GRID_FILTERS = ["all", "failed", "retried"];

const isFailed = (c) => c.status === "job-failed" || c.status === "job-offline";
const isRetried = (c) => c.retries > 0;

const matches = (c, filter) => {
  if (filter === "failed") return isFailed(c);
  if (filter === "retried") return isRetried(c);
  return true;
};

/**
 * One square per child_index, coloured by the child's job status. A corner mark means the
 * job was retried. `cells` is a sparse array/obj {[child_index]: {status, retries}}; indexes
 * without a job yet (not submitted) are drawn as empty squares up to `total`.
 */
function ScatterGrid({ cells, total, filter, onFilter, selected, onSelect }) {
  const byIndex = cells || {};
  const known = Object.keys(byIndex).map(Number);
  const n = Math.max(total || 0, known.length ? Math.max(...known) + 1 : 0);

  const byStatus = {};
  let retried = 0;
  known.forEach((i) => {
    const c = byIndex[i];
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    if (isRetried(c)) retried += 1;
  });
  const s = summarizeStatuses(byStatus);
  const counts = { all: n, failed: s.failed, retried };

  const squares = [];
  for (let i = 0; i < n; i++) {
    const c = byIndex[i];
    const dim = c ? !matches(c, filter) : filter !== "all";
    squares.push(
      <span
        key={i}
        className={`wf-cell ${c ? `wf-state-${c.status}` : "wf-cell-empty"} ${
          c && isRetried(c) ? "wf-cell-retried" : ""
        } ${dim ? "wf-cell-dim" : ""} ${selected === i ? "wf-cell-selected" : ""}`}
        title={
          c
            ? `#${i} ${c.status}${c.retries ? ` (retry ${c.retries})` : ""}`
            : `#${i} not submitted`
        }
        onClick={c && onSelect ? () => onSelect(i) : undefined}
      />
    );
  }

  return (
    <div className="wf-grid-wrapper">
      <div className="wf-grid-toolbar">
        <span className="wf-grid-filters">
          filter:{" "}
          {GRID_FILTERS.map((f) => (
            <button
              key={f}
              className={`wf-grid-filter ${filter === f ? "wf-grid-filter-on" : ""}`}
              onClick={() => onFilter(f)}
            >
              {f} {counts[f]}
            </button>
          ))}
        </span>
        <span className="wf-grid-summary">
          {s.completed}✓ {s.failed}✗ {s.revoked ? `${s.revoked} revoked ` : ""}
          {s.active} active / {n}
        </span>
      </div>
      <div className="wf-grid">{squares}</div>
    </div>
  );
}

ScatterGrid.propTypes = {
  cells: PropTypes.object,
  total: PropTypes.number,
  filter: PropTypes.string.isRequired,
  onFilter: PropTypes.func.isRequired,
  selected: PropTypes.number,
  onSelect: PropTypes.func,
};

export default ScatterGrid;
