import React from "react";
import PropTypes from "prop-types";

import { orderSpecNodes } from "../../utils/workflow";

import "../WorkflowCommon/style.css";
import "./style.css";

const ICON = {
  completed: "✓",
  failed: "✗",
  running: "●",
  cancelled: "⊘",
  pending: "·",
};

// steps: [{id, kind, isChild}] in spec order. Without a spec (still loading, or the fetch
// failed) fall back to the run's own node keys so the strip is never empty.
export const stepsFor = (run, spec) => {
  const ordered = orderSpecNodes(spec);
  if (ordered.length > 0) return ordered;
  return Object.keys(run.nodes || {}).map((id) => ({
    id,
    kind: "job",
    isChild: false,
  }));
};

function ScatterBar({ node, live, id, selected, onSelect, compact }) {
  node = node || {};
  const total = (live && live.total) || node.expected || 0;
  const done = live ? live.completed : node.completed || 0;
  const failed = live ? live.failed : node.failed || 0;
  const pct = (n) => (total ? `${Math.min(100, (n / total) * 100)}%` : "0%");
  const state = node.state || "pending";
  return (
    <span
      className={`wf-step wf-step-bar wf-state-${state} ${
        selected ? "wf-step-selected" : ""
      } ${onSelect ? "wf-step-clickable" : ""}`}
      title={`${id}: ${state}, ${done} done, ${failed} failed, ${total} total`}
      onClick={onSelect ? () => onSelect(id) : undefined}
    >
      <span className="wf-step-label">{id}</span>
      <span className="wf-bar">
        <span className="wf-bar-done" style={{ width: pct(done) }} />
        <span className="wf-bar-failed" style={{ width: pct(failed) }} />
      </span>
      {total || done || failed ? (
        <span className="wf-bar-text">
          {done}✓{failed ? ` ${failed}✗` : ""} /{total || "?"}
        </span>
      ) : null}
      {compact ? null : <span className="wf-step-state">{state}</span>}
    </span>
  );
}

/**
 * One chip per spec node in spec order. Job steps are chips, connector nodes (pass, scatter,
 * gather) small dots, a scatter's child a done/failed/total bar.
 *
 * `live` is optional per-step counts from a job_status aggregation, {[step]: {total,
 * completed, failed}}, which beats the run doc's counts while a scatter is in flight.
 */
function WorkflowStepStrip({ run, spec, live, selected, onSelect, compact, extra }) {
  const steps = stepsFor(run, spec);
  const nodes = run.nodes || {};
  const items = [];

  steps.forEach((s, i) => {
    const node = nodes[s.id] || {};
    const state = node.state || "pending";
    const isSel = selected === s.id;
    const click = onSelect ? () => onSelect(s.id) : undefined;
    const cls = `${isSel ? "wf-step-selected" : ""} ${
      onSelect ? "wf-step-clickable" : ""
    } ${run.failed_node === s.id ? "wf-step-failed-node" : ""}`;
    let el;

    if (s.isChild) {
      el = (
        <ScatterBar
          key={s.id}
          id={s.id}
          node={node}
          live={live && live[s.id]}
          selected={isSel}
          onSelect={onSelect}
          compact={compact}
        />
      );
    } else if (s.kind === "job") {
      el = (
        <span
          key={s.id}
          className={`wf-step wf-step-chip wf-state-${state} ${cls}`}
          title={`${s.id}: ${state}${node.error ? ` - ${node.error}` : ""}`}
          onClick={click}
        >
          <span className="wf-step-icon">{ICON[state] || "·"}</span>
          {s.id}
        </span>
      );
    } else if (compact) {
      el = (
        <span
          key={s.id}
          className={`wf-step wf-step-dot wf-state-${state} ${cls}`}
          title={`${s.id} (${s.kind}): ${state}`}
          onClick={click}
        />
      );
    } else {
      el = (
        <span
          key={s.id}
          className={`wf-step wf-step-connector wf-state-${state} ${cls}`}
          title={`${s.id} (${s.kind}): ${state}${node.error ? ` - ${node.error}` : ""}`}
          onClick={click}
        >
          <span className="wf-step-icon">{ICON[state] || "·"}</span>
          {s.id}
          <span className="wf-step-kind">{s.kind}</span>
        </span>
      );
    }
    if (i > 0) items.push(<span key={`sep-${s.id}`} className="wf-step-sep" />);
    items.push(el);
  });

  // steps that exist in job_status but not in the spec (e.g. _finalize, _halt)
  (extra || []).forEach((id) => {
    items.push(<span key={`sep-${id}`} className="wf-step-sep" />);
    items.push(
      <span
        key={id}
        className={`wf-step wf-step-connector wf-step-system ${
          selected === id ? "wf-step-selected" : ""
        } ${onSelect ? "wf-step-clickable" : ""}`}
        onClick={onSelect ? () => onSelect(id) : undefined}
      >
        {id}
      </span>
    );
  });

  return <div className={`wf-strip ${compact ? "wf-strip-compact" : ""}`}>{items}</div>;
}

WorkflowStepStrip.propTypes = {
  run: PropTypes.object.isRequired,
  spec: PropTypes.object,
  live: PropTypes.object,
  selected: PropTypes.string,
  onSelect: PropTypes.func,
  compact: PropTypes.bool,
  extra: PropTypes.array,
};

export default WorkflowStepStrip;
