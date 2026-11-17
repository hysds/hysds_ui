import React from "react";
import PropTypes from "prop-types";

import { displayState, scatterProgress } from "../../utils/workflow";

import "../WorkflowCommon/style.css";
import "./style.css";

const ICON = {
  completed: "✓",
  failed: "✗",
  running: "●",
  queued: "○",
  cancelled: "⊘",
  pending: "·",
  skipped: "↷",
};

function ScatterBar({ id, runStep, state, cls, onClick }) {
  const p = scatterProgress(runStep);
  const total = p.expected || 0;
  const pct = (n) => (total ? `${Math.min(100, (n / total) * 100)}%` : "0%");
  return (
    <span
      className={`wf-step wf-step-bar wf-state-${state} ${cls}`}
      title={`${id}: ${state}, ${p.completed} done, ${p.failed} failed of ${total || "?"}`}
      onClick={onClick}
    >
      <span className="wf-step-label">{id}</span>
      <span className="wf-bar">
        <span className="wf-bar-done" style={{ width: pct(p.completed) }} />
        <span className="wf-bar-failed" style={{ width: pct(p.failed) }} />
      </span>
      {total ? (
        <span className="wf-bar-text">
          {p.completed}/{total}
          {p.failed ? ` ${p.failed}✗` : ""}
        </span>
      ) : null}
    </span>
  );
}

/**
 * One chip per step of a run document, in the order the run doc lists them (the spec's
 * order). Skipped steps are dotted and struck through, halt steps square, a scattered step
 * a done/failed bar. Used on the list cards, where no spec is loaded: the run doc is enough.
 */
function WorkflowStepStrip({ run, selected, onSelect }) {
  const steps = (run && run.steps) || {};
  const items = [];
  Object.keys(steps).forEach((id, i) => {
    const rs = steps[id];
    const state = displayState(rs);
    const cls = `${selected === id ? "wf-step-selected" : ""} ${onSelect ? "wf-step-clickable" : ""} ${
      run.failed_step === id ? "wf-step-failed-node" : ""
    }`;
    const click = onSelect ? () => onSelect(id) : undefined;
    let el;
    if (rs.scatter) {
      el = <ScatterBar key={id} id={id} runStep={rs} state={state} cls={cls} onClick={click} />;
    } else if (rs.kind === "halt") {
      const hs = (rs.halt || {}).status || "failed";
      el = (
        <span
          key={id}
          className={`wf-step wf-step-halt wf-step-halt-${hs} wf-state-${state} ${cls}`}
          title={`${id} (halt ${hs}${(rs.halt || {}).fired ? ", fired" : ", not fired"})${
            (rs.halt || {}).reason ? `: ${rs.halt.reason}` : ""
          }`}
          onClick={click}
        >
          <span className="wf-step-icon">■</span>
          {id}
        </span>
      );
    } else {
      el = (
        <span
          key={id}
          className={`wf-step wf-step-chip wf-state-${state} ${cls}`}
          title={`${id}: ${state}${rs.error ? ` - ${rs.error}` : ""}`}
          onClick={click}
        >
          <span className="wf-step-icon">{ICON[state] || "·"}</span>
          {id}
        </span>
      );
    }
    if (i > 0) items.push(<span key={`sep-${id}`} className="wf-step-sep" />);
    items.push(el);
  });
  return <div className="wf-strip wf-strip-compact">{items}</div>;
}

WorkflowStepStrip.propTypes = {
  run: PropTypes.object.isRequired,
  selected: PropTypes.string,
  onSelect: PropTypes.func,
};

export default WorkflowStepStrip;
