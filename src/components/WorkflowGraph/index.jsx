import React from "react";
import PropTypes from "prop-types";

import { layoutGraph, edgeState, armsOf, armCondition } from "../../utils/workflow";

import "../WorkflowCommon/style.css";
import "./style.css";

const W = 176; // node box
const H = 46;
const GAP_X = 96; // between layers (room for arm labels)
const GAP_Y = 18;
const PAD = 12;

const ICON = { completed: "✓", failed: "✗", running: "●", cancelled: "⊘", skipped: "↷" };

const trunc = (t, n) => (t && t.length > n ? `${t.slice(0, n - 1)}…` : t || "");

// node outline: switch/gate get chamfered corners, everything else a rounded rect
function Shape({ kind, w, h }) {
  if (kind === "switch" || kind === "gate") {
    const c = 12;
    const pts = [[c, 0], [w - c, 0], [w, h / 2], [w - c, h], [c, h], [0, h / 2]];
    return <polygon className="wfg-shape" points={pts.map((p) => p.join(",")).join(" ")} />;
  }
  return <rect className="wfg-shape" width={w} height={h} rx={kind === "halt" ? 3 : 8} />;
}

function nodeTitle(id, node, state, runNode) {
  const lines = [`${id} (${node.kind || "job"}): ${state}`];
  if (node.kind === "halt") lines.push(`halt ${node.status}: ${node.reason || ""}`);
  armsOf(node).forEach((a) => lines.push(`${a.label}: ${armCondition(a)} -> ${a.target}`));
  if (runNode && runNode.skipped_by) lines.push(`skipped by ${runNode.skipped_by}`);
  if (runNode && runNode.error) lines.push(runNode.error);
  return lines.join("\n");
}

/**
 * Layered graph for specs with switch / gate / halt nodes. Arms are labelled; the taken
 * arm is drawn bold, arms not taken dimmed along with their skipped nodes. Halt nodes are
 * terminal markers carrying status and reason. A scatter child keeps its done/failed bar.
 */
function WorkflowGraph({ run, spec, live, selected, onSelect }) {
  const g = layoutGraph(spec);
  const runNodes = run.nodes || {};
  const pos = {};
  g.nodes.forEach((n) => {
    pos[n.id] = { x: PAD + n.layer * (W + GAP_X), y: PAD + n.row * (H + GAP_Y) };
  });
  const width = PAD * 2 + g.layers * W + Math.max(0, g.layers - 1) * GAP_X;
  const height = PAD * 2 + g.rows * H + Math.max(0, g.rows - 1) * GAP_Y;

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
    const lx = x1 + 8;
    const ly = y1 + (y2 === y1 ? -6 : y2 > y1 ? 12 : -6) + (y2 - y1) * 0.12;
    return (
      <g key={i} className={`wfg-edge wfg-edge-${st}`}>
        <title>
          {e.arm ? `${e.from} [${e.label}] ${armCondition(e.arm)} -> ${e.to}` : `${e.from} -> ${e.to}`}
        </title>
        <path d={d} markerEnd={`url(#wfg-arrow-${st})`} />
        {e.label ? (
          <text className="wfg-edge-label" x={lx} y={ly}>
            {trunc(e.label, 16)}
          </text>
        ) : null}
      </g>
    );
  });

  const nodeEls = g.nodes.map((n) => {
    const rn = runNodes[n.id] || {};
    const state = rn.state || "pending";
    const p = pos[n.id];
    const node = n.node;
    const arm = (rn.outputs || {}).arm;
    let sub = n.kind;
    if (n.kind === "halt") sub = `HALT ${node.status}: ${node.reason || ""}`;
    else if (arm !== undefined && arm !== null) sub = `${n.kind} → ${arm}`;
    else if (n.isChild) sub = "scatter child";
    else if (state === "skipped" && rn.skipped_by) sub = `${n.kind} · skipped by ${rn.skipped_by}`;
    else if (n.kind === "job" && node.run) sub = node.run;

    let bar = null;
    if (n.isChild) {
      const l = (live && live[n.id]) || {};
      const total = l.total || rn.expected || 0;
      const done = l.completed !== undefined ? l.completed : rn.completed || 0;
      const failed = l.failed !== undefined ? l.failed : rn.failed || 0;
      const pct = (v) => (total ? Math.min(100, (v / total) * 100) : 0);
      bar = (
        <g transform={`translate(10,${H - 9})`}>
          <rect className="wfg-bar-bg" width={W - 20} height={4} rx={2} />
          <rect className="wfg-bar-done" width={((W - 20) * pct(done)) / 100} height={4} rx={2} />
          <rect
            className="wfg-bar-failed"
            x={((W - 20) * pct(done)) / 100}
            width={((W - 20) * pct(failed)) / 100}
            height={4}
          />
        </g>
      );
    }

    return (
      <g
        key={n.id}
        transform={`translate(${p.x},${p.y})`}
        className={`wfg-node wf-state-${state} wfg-kind-${n.kind} ${
          n.kind === "halt" ? `wfg-halt-${node.status}` : ""
        } ${selected === n.id ? "wfg-selected" : ""} ${
          run.failed_node === n.id ? "wfg-failed-node" : ""
        } ${onSelect ? "wfg-clickable" : ""}`}
        onClick={onSelect ? () => onSelect(n.id) : undefined}
      >
        <title>{nodeTitle(n.id, node, state, rn)}</title>
        <Shape kind={n.kind} w={W} h={H} />
        <text className="wfg-id" x={10} y={bar ? 16 : 19}>
          {n.kind === "halt" ? "■ " : ICON[state] ? `${ICON[state]} ` : ""}
          {trunc(n.id, 22)}
        </text>
        <text className="wfg-sub" x={10} y={bar ? 28 : 35}>
          {trunc(sub, 30)}
        </text>
        {bar}
      </g>
    );
  });

  return (
    <div className="wfg-wrap">
      <svg className="wfg" width={width} height={height} role="img" aria-label="workflow graph">
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
  spec: PropTypes.object.isRequired,
  live: PropTypes.object,
  selected: PropTypes.string,
  onSelect: PropTypes.func,
};

export default WorkflowGraph;
