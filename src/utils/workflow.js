// Pure helpers for the Workflows pages. Everything here tolerates fields that the
// backend has not written yet (spec_name, duration_s, username, ended_at, ...).

const TERMINAL = ["completed", "failed", "cancelled"];

exports.isTerminal = (status) => TERMINAL.includes(status);

/** "name:version" -> {name, version}. Splits on the LAST colon; no colon -> no version. */
exports.parseSpecId = (specId) => {
  if (!specId) return { name: "", version: "" };
  const i = specId.lastIndexOf(":");
  if (i < 0) return { name: specId, version: "" };
  return { name: specId.slice(0, i), version: specId.slice(i + 1) };
};

/** spec name/version from the run doc, falling back to spec_id */
exports.runSpec = (run) => {
  const parsed = exports.parseSpecId(run.spec_id);
  return {
    name: run.spec_name || parsed.name,
    version: run.spec_version || parsed.version,
  };
};

exports.runUser = (run) => run.username || run.user || "";

const toMs = (t) => {
  if (!t) return null;
  const ms = Date.parse(t);
  return isNaN(ms) ? null : ms;
};
exports.toMs = toMs;

/**
 * Run duration in seconds. duration_s when the backend writes it, otherwise derived from
 * the timestamps: ended_at, else updated_at for a terminal run, else now (running).
 */
exports.runDurationSeconds = (run, now = Date.now()) => {
  if (typeof run.duration_s === "number") return run.duration_s;
  const start = toMs(run.submitted_at);
  if (start === null) return null;
  let end = toMs(run.ended_at);
  if (end === null) end = exports.isTerminal(run.status) ? toMs(run.updated_at) : now;
  if (end === null) return null;
  return Math.max(0, (end - start) / 1000);
};

exports.formatDuration = (seconds) => {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return "-";
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m${String(s % 60).padStart(2, "0")}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h${String(m % 60).padStart(2, "0")}m`;
  return `${Math.floor(h / 24)}d${String(h % 24).padStart(2, "0")}h`;
};

/** "2026-11-11T20:07:44.123Z" -> "11-11 20:07:44" (UTC, as everywhere else in the UI) */
exports.shortTime = (t) => (t ? String(t).slice(5, 19).replace("T", " ") : "-");

// ---------------------------------------------------------------------------------------
// Routing (spec v1.2): switch / gate / halt
// ---------------------------------------------------------------------------------------

const ROUTING_KINDS = ["switch", "gate"];
exports.isRouting = (node) => !!node && ROUTING_KINDS.includes(node.kind);

/** True when a spec uses any v1.2 routing kind (graph view is only used for those) */
exports.hasRouting = (spec) =>
  !!spec &&
  !!spec.nodes &&
  Object.values(spec.nodes).some(
    (n) => n && (ROUTING_KINDS.includes(n.kind) || n.kind === "halt")
  );

const asTargets = (v) => (Array.isArray(v) ? v.filter(Boolean) : v ? [v] : []);

/**
 * The arms of a switch/gate, in evaluation order: [{label, target, when?}].
 * Labels: case name or case_<i>; the choices key; "default"; a gate's "true"/"false".
 * Other node kinds have no arms.
 */
exports.armsOf = (node) => {
  if (!node) return [];
  const arms = [];
  if (node.kind === "gate") {
    asTargets(node.on_true).forEach((t) => arms.push({ label: "true", target: t, when: node.when }));
    asTargets(node.on_false).forEach((t) => arms.push({ label: "false", target: t, when: node.when, negated: true }));
    return arms;
  }
  if (node.kind !== "switch") return [];
  if (Array.isArray(node.cases)) {
    node.cases.forEach((c, i) =>
      asTargets(c.next).forEach((t) =>
        arms.push({ label: c.name || `case_${i}`, target: t, when: c.when })
      )
    );
  } else if (node.choices && typeof node.choices === "object") {
    Object.keys(node.choices).forEach((k) =>
      asTargets(node.choices[k]).forEach((t) =>
        arms.push({ label: k, target: t, choice: k, on: node.on })
      )
    );
  }
  asTargets(node.default).forEach((t) => arms.push({ label: "default", target: t }));
  return arms;
};

/** `next` plus all arm targets, deduplicated (like hysds_commons successors()) */
exports.successors = (node) => {
  if (!node) return [];
  const out = [];
  asTargets(node.next)
    .concat(exports.armsOf(node).map((a) => a.target))
    .forEach((t) => {
      if (!out.includes(t)) out.push(t);
    });
  return out;
};

const OP_SYMBOL = { eq: "==", ne: "!=", lt: "<", le: "<=", gt: ">", ge: ">=", in: "in" };

const operand = (v) => (typeof v === "string" && v.startsWith("$") ? v : JSON.stringify(v));

/** A `when` tree as one readable line, e.g. `$.L2SMP.qa_score < 0.3` */
exports.formatWhen = (when, nested) => {
  if (when === null || when === undefined) return "";
  if (Array.isArray(when.all) || Array.isArray(when.any)) {
    const isAll = Array.isArray(when.all);
    const parts = (isAll ? when.all : when.any).map((w) => exports.formatWhen(w, true));
    const text = parts.join(isAll ? " AND " : " OR ");
    return nested && parts.length > 1 ? `(${text})` : text;
  }
  if (when.not) return `NOT (${exports.formatWhen(when.not)})`;
  if ("left" in when) {
    return `${operand(when.left)} ${OP_SYMBOL[when.op] || when.op} ${operand(when.right)}`;
  }
  return JSON.stringify(when);
};

/** One-line description of how an arm is chosen, for tooltips and the detail panel */
exports.armCondition = (arm) => {
  if (arm.label === "default") return "otherwise";
  if (arm.choice !== undefined) return `${arm.on} == ${JSON.stringify(arm.choice)}`;
  if (arm.negated) return `NOT (${exports.formatWhen(arm.when)})`;
  return exports.formatWhen(arm.when);
};

/** Arm label -> readable error class for run headers and cards */
exports.ERROR_CLASS_LABELS = {
  halted: "halted (halt node)",
  routing: "routing (switch could not be evaluated)",
  input_resolution: "input resolution",
};
exports.errorClassLabel = (c) => (c ? exports.ERROR_CLASS_LABELS[c] || c : "");

/**
 * Lay a spec's nodes out in reading order: from `entry`, following `next` and switch/gate
 * arms; a scatter's `child` comes straight after the scatter node. Unreachable nodes are
 * appended.
 *
 * Returns [{id, kind, isChild, node}]. `isChild` marks a scatter child (drawn as a bar).
 */
exports.orderSpecNodes = (spec) => {
  if (!spec || !spec.nodes) return [];
  const nodes = spec.nodes;
  const out = [];
  const seen = new Set();
  const childIds = new Set(
    Object.values(nodes)
      .filter((n) => n && n.kind === "scatter" && n.child)
      .map((n) => n.child)
  );

  const visit = (id) => {
    if (!id || seen.has(id) || !nodes[id]) return;
    seen.add(id);
    const node = nodes[id];
    out.push({ id, kind: node.kind || "job", isChild: childIds.has(id), node });
    if (node.kind === "scatter" && node.child) visit(node.child);
    exports.successors(node).forEach(visit);
  };

  visit(spec.entry);
  Object.keys(nodes).forEach(visit);
  return out;
};

/**
 * The strip for a run that may have branched: nodes on arms not taken (state `skipped`)
 * are dropped from the path and counted. Returns {steps, skipped: [ids]}. A run without
 * skipped nodes (every pre-1.2 run) gets its steps back unchanged.
 */
exports.pathSteps = (run, steps) => {
  const nodes = (run && run.nodes) || {};
  const skipped = [];
  const kept = steps.filter((s) => {
    if ((nodes[s.id] || {}).state === "skipped") {
      skipped.push(s.id);
      return false;
    }
    return true;
  });
  return { steps: kept, skipped };
};

/**
 * Layered DAG layout from spec successors (simple longest-path layering), for the run
 * page graph. A scatter is drawn as scatter -> child -> its `next` targets.
 *
 * Returns {nodes: [{id, kind, layer, row, isChild, node}], edges: [{from, to, label?, arm?}],
 * layers: number, rows: number}. `label` is only set on switch/gate arms.
 */
exports.layoutGraph = (spec) => {
  const ordered = exports.orderSpecNodes(spec);
  const index = {};
  ordered.forEach((o, i) => (index[o.id] = i));
  const edges = [];
  const addEdge = (from, to, arm) => {
    if (!index.hasOwnProperty(to)) return;
    edges.push(arm ? { from, to, label: arm.label, arm } : { from, to });
  };
  ordered.forEach((o) => {
    const n = o.node;
    if (n.kind === "scatter" && n.child && index.hasOwnProperty(n.child)) {
      addEdge(o.id, n.child);
      asTargets(n.next).forEach((t) => addEdge(n.child, t));
    } else if (exports.isRouting(n)) {
      exports.armsOf(n).forEach((a) => addEdge(o.id, a.target, a));
    } else {
      asTargets(n.next).forEach((t) => addEdge(o.id, t));
    }
  });

  const preds = {};
  edges.forEach((e) => (preds[e.to] = (preds[e.to] || []).concat(e.from)));
  const layerOf = {};
  const visiting = new Set();
  const layer = (id) => {
    if (layerOf[id] !== undefined) return layerOf[id];
    if (visiting.has(id)) return 0; // cycle guard; validation rejects cycles
    visiting.add(id);
    const l = (preds[id] || []).reduce((m, p) => Math.max(m, layer(p) + 1), 0);
    visiting.delete(id);
    layerOf[id] = l;
    return l;
  };
  ordered.forEach((o) => layer(o.id));

  const nLayers = ordered.reduce((m, o) => Math.max(m, layerOf[o.id] + 1), 0);
  const byLayer = Array.from({ length: nLayers }, () => []);
  ordered.forEach((o) => byLayer[layerOf[o.id]].push(o));
  const rowOf = {};
  byLayer.forEach((col) => {
    // barycenter of already placed predecessors, then spec order
    const key = (o) => {
      const ps = (preds[o.id] || []).filter((p) => rowOf[p] !== undefined);
      return ps.length ? ps.reduce((a, p) => a + rowOf[p], 0) / ps.length : 0;
    };
    col.sort((a, b) => key(a) - key(b) || index[a.id] - index[b.id]);
    col.forEach((o, r) => (rowOf[o.id] = r));
  });

  return {
    nodes: ordered.map((o) => ({ ...o, layer: layerOf[o.id], row: rowOf[o.id] })),
    edges,
    layers: nLayers,
    rows: byLayer.reduce((m, c) => Math.max(m, c.length), 0),
  };
};

/**
 * Is a graph edge on the path the run took? "taken" | "untaken" | "open" (not decided yet).
 * Arm edges use the switch node's outputs.arm; plain edges follow their endpoint states.
 */
exports.edgeState = (run, edge) => {
  const nodes = (run && run.nodes) || {};
  const from = nodes[edge.from] || {};
  const to = nodes[edge.to] || {};
  if (edge.arm) {
    const arm = (from.outputs || {}).arm;
    if (arm === undefined || arm === null) return from.state === "skipped" ? "untaken" : "open";
    return arm === edge.label ? "taken" : "untaken";
  }
  if (from.state === "skipped" || to.state === "skipped") return "untaken";
  if (from.state === "completed" && ["running", "completed", "failed"].includes(to.state))
    return "taken";
  return "open";
};

/** Pick the facets to show: first candidate field with data, hide a facet with none. */
exports.resolveFilters = (candidates, fieldCounts) =>
  candidates
    .map((f) => {
      const dataField = f.candidates.find((c) => fieldCounts[c] > 0);
      if (!dataField) return null;
      const { candidates: _c, ...rest } = f;
      return { ...rest, dataField };
    })
    .filter(Boolean);

/** Every distinct field named by the facet candidates (for the one probe query) */
exports.candidateFields = (candidates, extra = []) => [
  ...new Set([...candidates.reduce((a, f) => a.concat(f.candidates), []), ...extra]),
];

/** s3://bucket/key -> browsable https URL; http(s) passes through; anything else null */
exports.toLink = (value) => {
  if (typeof value !== "string") return null;
  const m = /^s3:\/\/([^/]+)\/?(.*)$/.exec(value);
  if (m) return `https://${m[1]}.s3.amazonaws.com/${m[2]}`;
  if (/^https?:\/\/\S+$/.test(value)) return value;
  return null;
};

/** CWL-ish typed value: {class: "File"|"Directory", location|path|url} */
exports.fileLocation = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (value.class !== "File" && value.class !== "Directory") return null;
  return value.location || value.path || value.url || null;
};

/** Counts of job_status docs by status for one step, from a terms agg bucket list */
exports.summarizeStatuses = (byStatus) => {
  const s = byStatus || {};
  const total = Object.values(s).reduce((a, b) => a + b, 0);
  return {
    total,
    completed: s["job-completed"] || 0,
    failed: (s["job-failed"] || 0) + (s["job-offline"] || 0),
    revoked: s["job-revoked"] || 0,
    active: (s["job-queued"] || 0) + (s["job-started"] || 0),
  };
};

/** URL for a deep link to the Jobs page, filtered by run (and step). */
exports.jobsUrl = (runId, stepId) => {
  const p = [`workflow_run=${encodeURIComponent(JSON.stringify(runId))}`];
  if (stepId) p.push(`workflow_step=${encodeURIComponent(JSON.stringify(stepId))}`);
  return `/figaro?${p.join("&")}`;
};

/** Which step to select first on the run page */
exports.defaultStep = (run, ordered) => {
  if (!run) return null;
  if (run.failed_node) return run.failed_node;
  const nodes = run.nodes || {};
  const failed = ordered.find((o) => (nodes[o.id] || {}).state === "failed");
  if (failed) return failed.id;
  const running = ordered.find((o) => (nodes[o.id] || {}).state === "running");
  if (running) return running.id;
  const child = ordered.find((o) => o.isChild);
  if (child) return child.id;
  const jobs = ordered.filter((o) => o.kind === "job");
  const last = [...jobs].reverse().find((o) => (nodes[o.id] || {}).state === "completed");
  return (last || jobs[0] || ordered[0] || {}).id || null;
};
