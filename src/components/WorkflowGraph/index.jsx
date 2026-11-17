import React from "react";
import PropTypes from "prop-types";

import {
  layoutGraph,
  edgeState,
  scatterProgress,
  haltedBy,
} from "../../utils/workflow";

import "../WorkflowCommon/style.css";
import "./style.css";

const W = 184; // node box
const H = 56;
const GAP_X = 70; // between layers
const GAP_Y = 18;
const PAD = 12;

const ICON = { completed: "✓", failed: "✗", running: "●", queued: "○", cancelled: "⊘", skipped: "↷" };

const trunc = (t, n) => (t && t.length > n ? `${t.slice(0, n - 1)}…` : t || "");

function subtitle(n) {
  const rs = n.run || {};
  if (n.kind === "halt") {
    const h = rs.halt || (n.spec && n.spec.halt) || {};
    return `HALT ${h.status || ""}${h.fired ? " (fired)" : ""}`;
  }
  if (n.state === "skipped") return "skipped: when was false";
  const p = scatterProgress(rs);
  if (p && p.expected !== null)
    return `${p.completed}/${p.expected} done${p.failed ? ` · ${p.failed} failed` : ""}`;
  if (p) return "scatter";
  return n.jobType || "";
}

function nodeTitle(n) {
  const rs = n.run || {};
  const lines = [`${n.id} (${n.kind}): ${n.state}`];
  if (n.jobType) lines.push(n.jobType);
  if (n.when) lines.push(`when ${n.when}`);
  if (n.deps.length) lines.push(`depends on ${n.deps.join(", ")}`);
  if (rs.skipped_by) lines.push(`skipped: ${rs.skipped_by.flag} was ${JSON.stringify(rs.skipped_by.value)}`);
  if (rs.halt) lines.push(`halt ${rs.halt.status}: ${rs.halt.reason || ""}${rs.halt.fired ? " (fired)" : ""}`);
  if (rs.error) lines.push(rs.error);
  return lines.join("\n");
}

/**
 * The step graph of a run: one box per step of the compiled spec, one edge per dependency
 * (`deps`), so parallel branches sit side by side and a join has several incoming edges.
 * A step gated by `when` carries a WHEN tag and its flag; the edge that supplies the flag is
 * dashed. A skipped step is hatched, dotted and struck through and its edges are dimmed
 * (it never started); a halt step is a square marker; a scattered step shows its progress.
 * Without a spec (not registered / still loading) the boxes are laid out in one column.
 */
function WorkflowGraph({ run, merged, selected, onSelect }) {
  const g = layoutGraph(merged);
  const pos = {};
  g.nodes.forEach((n) => {
    pos[n.id] = { x: PAD + n.layer * (W + GAP_X), y: PAD + n.row * (H + GAP_Y) };
  });
  const width = PAD * 2 + g.layers * W + Math.max(0, g.layers - 1) * GAP_X;
  const height = PAD * 2 + g.rows * H + Math.max(0, g.rows - 1) * GAP_Y;
  const halted = haltedBy(run);

  const edgeEls = g.edges.map((e, i) => {
    const a = pos[e.from];
    const b = pos[e.to];
    const x1 = a.x + W;
    const y1 = a.y + H / 2;
    const x2 = b.x;
    const y2 = b.y + H / 2;
    const mx = (x1 + x2) / 2;
    const st = edgeState(run, e);
    const d =
      x2 > x1
        ? `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2 - 2},${y2}`
        : `M${x1},${y1} L${x1 + 10},${y1} L${x1 + 10},${y2} L${x2 - 2},${y2}`;
    return (
      <g key={i} className={`wfg-edge wfg-edge-${st} ${e.gate ? "wfg-edge-gate" : ""}`}>
        <title>{`${e.from} -> ${e.to}${e.gate ? " (supplies the when flag)" : ""}`}</title>
        <path d={d} markerEnd={`url(#wfg-arrow-${st})`} />
      </g>
    );
  });

  const nodeEls = g.nodes.map((n) => {
    const p = pos[n.id];
    const rs = n.run || {};
    const sc = scatterProgress(rs);
    let bar = null;
    if (sc && sc.expected) {
      const pct = (v) => Math.min(100, (v / sc.expected) * 100);
      bar = (
        <g transform={`translate(10,${H - 9})`}>
          <rect className="wfg-bar-bg" width={W - 20} height={4} rx={2} />
          <rect className="wfg-bar-done" width={((W - 20) * pct(sc.completed)) / 100} height={4} rx={2} />
          <rect
            className="wfg-bar-failed"
            x={((W - 20) * pct(sc.completed)) / 100}
            width={((W - 20) * pct(sc.failed)) / 100}
            height={4}
          />
        </g>
      );
    }
    const fired = n.kind === "halt" && halted && halted.step === n.id;
    return (
      <g
        key={n.id}
        transform={`translate(${p.x},${p.y})`}
        className={`wfg-node wf-state-${n.state} wfg-kind-${n.kind} ${
          n.kind === "halt" ? `wfg-halt-${(rs.halt || (n.spec || {}).halt || {}).status || "failed"}` : ""
        } ${fired ? "wfg-halt-fired" : ""} ${n.when ? "wfg-gated" : ""} ${
          selected === n.id ? "wfg-selected" : ""
        } ${run.failed_step === n.id ? "wfg-failed-node" : ""} ${onSelect ? "wfg-clickable" : ""}`}
        onClick={onSelect ? () => onSelect(n.id) : undefined}
      >
        <title>{nodeTitle(n)}</title>
        <rect className="wfg-shape" width={W} height={H} rx={n.kind === "halt" ? 3 : 8} />
        <text className="wfg-id" x={10} y={17}>
          {n.kind === "halt" ? "■ " : ICON[n.state] ? `${ICON[n.state]} ` : ""}
          {trunc(n.id, 20)}
        </text>
        <text className="wfg-sub" x={10} y={31}>
          {trunc(subtitle(n), 30)}
        </text>
        {n.when ? (
          <text className="wfg-when" x={10} y={bar ? 43 : 45}>
            when {trunc(n.when, 24)}
          </text>
        ) : null}
        {bar}
        {n.when ? (
          <g className="wfg-when-tag" transform={`translate(${W - 38},4)`}>
            <rect width={34} height={12} rx={3} />
            <text x={17} y={9} textAnchor="middle">
              WHEN
            </text>
          </g>
        ) : null}
      </g>
    );
  });

  return (
    <div className="wfg-wrap">
      <svg className="wfg" width={width} height={height} role="img" aria-label="workflow step graph">
        <defs>
          {["taken", "untaken", "open"].map((s) => (
            <marker
              key={s}
              id={`wfg-arrow-${s}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
              className={`wfg-marker wfg-marker-${s}`}
            >
              <path d="M0,0 L10,5 L0,10 z" />
            </marker>
          ))}
        </defs>
        {edgeEls}
        {nodeEls}
      </svg>
    </div>
  );
}

WorkflowGraph.propTypes = {
  run: PropTypes.object.isRequired,
  merged: PropTypes.array.isRequired,
  selected: PropTypes.string,
  onSelect: PropTypes.func,
};

export default WorkflowGraph;
