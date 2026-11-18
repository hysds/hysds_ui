// Pure helpers for the Workflows pages (workflow run documents 2.0 and compiled specs 2.0).
// Everything here tolerates fields that a run does not have (yet): a freshly created run has
// no outputs, a step that never started has no attempts, and so on.

const TERMINAL = ["completed", "failed", "cancelled"];
const LIVE = ["running", "halting"];
const SETTLED_STEP = ["completed", "failed", "skipped", "cancelled"];

exports.isTerminal = (status) => TERMINAL.includes(status);
/** running or halting (a drain is waiting for running jobs): the run can still change */
exports.isLive = (status) => LIVE.includes(status);
exports.isSettledStep = (state) => SETTLED_STEP.includes(state);

/** "name:version" -> {name, version}. Splits on the LAST colon; no colon -> no version. */
exports.parseSpecId = (specId) => {
  if (!specId) return { name: "", version: "" };
  const i = specId.lastIndexOf(":");
  if (i < 0) return { name: specId, version: "" };
  return { name: specId.slice(0, i), version: specId.slice(i + 1) };
};

/** name/version of the run's workflow. v2 run docs carry spec_id (the name) and spec_version. */
exports.runSpec = (run) => {
  if (run.spec_version) return { name: run.spec_id || "", version: String(run.spec_version) };
  return exports.parseSpecId(run.spec_id);
};

/** The id the CWL endpoint knows the workflow by: "<name>:<version>" */
exports.specKey = (run) => {
  const { name, version } = exports.runSpec(run);
  return version ? `${name}:${version}` : name;
};

exports.cwlUrl = (key) => `/workflows/cwl/${encodeURIComponent(key)}`;

/**
 * A route param as the user meant it. history 4 decodes the path with decodeURI, which leaves
 * reserved characters such as ":" (%3A) encoded, so "/workflows/cwl/a%3A1.0.0" arrives as "a%3A1.0.0".
 */
exports.routeParam = (value) => {
  if (!value) return value;
  try {
    return decodeURIComponent(value);
  } catch (e) {
    return value;
  }
};

exports.runUser = (run) => run.username || run.user || "";

const toMs = (t) => {
  if (!t) return null;
  const ms = Date.parse(t);
  return isNaN(ms) ? null : ms;
};
exports.toMs = toMs;

exports.runStart = (run) => run.started_at || run.created_at || null;

/** Run duration in seconds: start -> ended_at, else updated_at for a terminal run, else now. */
exports.runDurationSeconds = (run, now = Date.now()) => {
  const start = toMs(exports.runStart(run));
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

/** Duration between two timestamps (a step or an attempt), "-" when the start is unknown */
exports.spanSeconds = (start, end, now = Date.now()) => {
  const a = toMs(start);
  if (a === null) return null;
  const b = toMs(end);
  return Math.max(0, ((b === null ? now : b) - a) / 1000);
};

/** cancelled_by is a user name in the run doc, but tolerate an object */
exports.cancelledByText = (v) => {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v.username || v.user || v.name || JSON.stringify(v);
};

const ERROR_CLASS_LABELS = {
  input_resolution: "input resolution (a step input could not be resolved)",
  output_resolution: "output resolution (a workflow output could not be resolved)",
  scatter_threshold: "scatter threshold (too many children failed)",
  halted: "halted (halt step)",
  timeout: "timeout",
  worker: "worker error",
  offline: "worker went offline",
  signal: "signal",
};
exports.errorClassLabel = (c) => (c ? ERROR_CLASS_LABELS[c] || c : "");

// ---------------------------------------------------------------------------------------
// Steps and the dependency graph
// ---------------------------------------------------------------------------------------

const REF = /^\$\.([A-Za-z0-9_-]+)\./;

/** Step id named by a `$.step.output` ref, or null for `$.inputs.*` and non-refs */
exports.refStep = (ref) => {
  if (typeof ref !== "string") return null;
  const m = REF.exec(ref);
  return m && m[1] !== "inputs" ? m[1] : null;
};

/** deps of a compiled step: the stored list, else derived from its `in` sources and `when` */
exports.stepDeps = (step) => {
  if (!step) return [];
  if (Array.isArray(step.deps)) return step.deps;
  const out = [];
  const add = (r) => {
    const s = exports.refStep(r);
    if (s && !out.includes(s)) out.push(s);
  };
  Object.values(step.in || {}).forEach((i) => ((i && i.source) || []).forEach(add));
  add(step.when);
  return out;
};

/** "job" or "halt" */
exports.stepKind = (specStep, runStep) =>
  (specStep && specStep.halt) || (runStep && runStep.kind === "halt") ? "halt" : "job";

/** State to show: the run doc's `waiting` is shown as `pending` */
exports.displayState = (runStep) => {
  const s = (runStep || {}).state;
  return !s || s === "waiting" ? "pending" : s;
};

/**
 * Steps in spec order with everything the graph and panel need, merging the compiled spec
 * (deps, when, in, scatter) with the run doc's step state. Works without the spec too (still
 * loading, or the run's workflow is not registered here): then only the run doc's steps are
 * known and there are no edges.
 */
exports.mergeSteps = (run, spec) => {
  const runSteps = (run && run.steps) || {};
  const specSteps = (spec && spec.steps) || {};
  const ids = Object.keys(specSteps);
  Object.keys(runSteps).forEach((id) => {
    if (!ids.includes(id)) ids.push(id);
  });
  return ids.map((id) => {
    const sp = specSteps[id] || null;
    const rs = runSteps[id] || null;
    return {
      id,
      kind: exports.stepKind(sp, rs),
      spec: sp,
      run: rs,
      deps: sp ? exports.stepDeps(sp) : [],
      when: (sp && sp.when) || null,
      scatter: !!((sp && sp.scatter) || (rs && rs.scatter)),
      jobType: (sp && sp.job_type) || (rs && rs.job_type) || null,
      state: exports.displayState(rs),
    };
  });
};

/**
 * Layered DAG layout from `deps` (longest-path layering), with rows ordered by the average
 * row of the already-placed predecessors so parallel branches sit side by side.
 *
 * Returns {nodes: [{id, layer, row, ...merged step}], edges: [{from, to, gate}], layers, rows}.
 * An edge is a `gate` edge when `from` supplies the `when` flag of `to`.
 */
exports.layoutGraph = (merged) => {
  const byId = {};
  merged.forEach((s) => (byId[s.id] = s));
  const edges = [];
  merged.forEach((s) =>
    s.deps.forEach((d) => {
      if (byId[d]) edges.push({ from: d, to: s.id, gate: exports.refStep(s.when) === d });
    })
  );
  const preds = {};
  edges.forEach((e) => (preds[e.to] = (preds[e.to] || []).concat(e.from)));
  const index = {};
  merged.forEach((s, i) => (index[s.id] = i));

  const layerOf = {};
  const visiting = new Set();
  const layer = (id) => {
    if (layerOf[id] !== undefined) return layerOf[id];
    if (visiting.has(id)) return 0; // cycle guard; the compiler rejects cycles
    visiting.add(id);
    const l = (preds[id] || []).reduce((m, p) => Math.max(m, layer(p) + 1), 0);
    visiting.delete(id);
    layerOf[id] = l;
    return l;
  };
  merged.forEach((s) => layer(s.id));

  const nLayers = merged.reduce((m, s) => Math.max(m, layerOf[s.id] + 1), 0);
  const byLayer = Array.from({ length: nLayers }, () => []);
  merged.forEach((s) => byLayer[layerOf[s.id]].push(s));
  const rowOf = {};
  byLayer.forEach((col) => {
    const key = (s) => {
      const ps = (preds[s.id] || []).filter((p) => rowOf[p] !== undefined);
      return ps.length ? ps.reduce((a, p) => a + rowOf[p], 0) / ps.length : 0;
    };
    col.sort((a, b) => key(a) - key(b) || index[a.id] - index[b.id]);
    col.forEach((s, r) => (rowOf[s.id] = r));
  });

  return {
    nodes: merged.map((s) => ({ ...s, layer: layerOf[s.id], row: rowOf[s.id] })),
    edges,
    layers: nLayers,
    rows: byLayer.reduce((m, c) => Math.max(m, c.length), 0),
  };
};

/**
 * Did data flow along this edge? "taken" | "untaken" | "open".
 * A skipped or cancelled endpoint means nothing flowed; a completed source whose dependent
 * has started (or finished) means it did. A dependent of a skipped step still runs (it gets
 * null for that source), so the edge is untaken but the node is not.
 */
exports.edgeState = (run, edge) => {
  const steps = (run && run.steps) || {};
  const from = (steps[edge.from] || {}).state;
  const to = (steps[edge.to] || {}).state;
  if (["skipped", "cancelled"].includes(from) || ["skipped", "cancelled"].includes(to)) return "untaken";
  if (from === "completed" && ["queued", "running", "completed", "failed"].includes(to)) return "taken";
  return "open";
};

/** Which step to select first on the run page */
exports.defaultStep = (run, merged) => {
  if (!run || merged.length === 0) return null;
  if (run.failed_step && merged.some((s) => s.id === run.failed_step)) return run.failed_step;
  const find = (state) => merged.find((s) => s.run && s.run.state === state);
  const hit = find("failed") || find("running") || find("queued");
  if (hit) return hit.id;
  const halted = exports.haltedBy(run);
  if (halted) return halted.step;
  const done = [...merged].reverse().find((s) => s.run && s.run.state === "completed");
  return (done || merged[0]).id;
};

/** The halt step that fired, as {step, status, reason}, or null */
exports.haltedBy = (run) => {
  const steps = (run && run.steps) || {};
  const id = Object.keys(steps).find((k) => steps[k].kind === "halt" && (steps[k].halt || {}).fired);
  if (!id) return null;
  const h = steps[id].halt;
  return { step: id, status: h.status, reason: h.reason || "" };
};

/** Why a step is in its state: [{kind, text}] from skipped_by / cancelled_by / halt / error */
exports.stepReasons = (runStep) => {
  const st = runStep || {};
  const out = [];
  if (st.skipped_by) {
    out.push({
      kind: "skipped",
      text: `skipped: when ${st.skipped_by.flag} was ${JSON.stringify(st.skipped_by.value)}`,
    });
  }
  if (st.cancelled_by) {
    const c = st.cancelled_by;
    const tail = c.reason ? `: ${c.reason}` : "";
    const text =
      {
        failure: `cancelled because step ${c.step} failed${tail}`,
        halt: `cancelled by the halt in step ${c.step}${tail}`,
        user: `cancelled by the user${tail}`,
        upstream_failed: `not started: it depends on failed step ${c.step}${tail}`,
      }[c.kind] || `cancelled (${c.kind || "unknown"})${tail}`;
    out.push({ kind: "cancelled", text });
  }
  if (st.halt) {
    out.push({
      kind: st.halt.fired ? "halt-fired" : "halt",
      text: st.halt.fired
        ? `halt fired (run ${st.halt.status}): ${st.halt.reason || "no reason given"}`
        : `halt (run ${st.halt.status}): ${st.halt.reason || "no reason given"}; not fired`,
    });
  }
  if (st.error || st.error_class) {
    out.push({
      kind: "error",
      text: `${st.error_class ? `(${st.error_class}) ` : ""}${st.error || ""}`.trim(),
    });
  }
  return out;
};

/** A step's compiled `in` as rows: {name, sources, link_merge, pick, default, hasDefault} */
exports.inputRows = (specStep) =>
  Object.entries((specStep && specStep.in) || {}).map(([name, i]) => ({
    name,
    sources: (i && i.source) || [],
    link_merge: (i && i.link_merge) || null,
    pick: (i && i.pick) || null,
    hasDefault: !!i && Object.prototype.hasOwnProperty.call(i, "default"),
    default: i && i.default,
  }));

// ---------------------------------------------------------------------------------------
// Scatter
// ---------------------------------------------------------------------------------------

/** Counters of a scattered step: {expected, completed, failed, active, threshold, phase} */
exports.scatterProgress = (runStep) => {
  const sc = (runStep || {}).scatter;
  if (!sc) return null;
  const expected = typeof sc.expected === "number" ? sc.expected : null;
  const completed = sc.n_completed || 0;
  const failed = sc.n_failed || 0;
  return {
    expected,
    completed,
    failed,
    active: expected === null ? 0 : Math.max(0, expected - completed - failed),
    threshold: typeof sc.threshold === "number" ? sc.threshold : 1,
    phase: sc.phase || null,
    input: sc.input || null,
    children: Array.isArray(sc.children) ? sc.children : null,
  };
};

/**
 * Did the scatter meet its completion threshold? Mirrors the engine: n == 0 passes, else
 * completed / n >= threshold. `settled` is false until every child has finished, and then
 * `passed` is only the outlook so far. Returns null before the fan-out is known.
 */
exports.thresholdResult = (progress) => {
  if (!progress || progress.expected === null) return null;
  const { expected, completed, failed, threshold } = progress;
  const need = Math.ceil(threshold * expected - 1e-9);
  const settled = completed + failed >= expected;
  const ratio = expected === 0 ? 1 : completed / expected;
  const passed = expected === 0 || ratio >= threshold - 1e-9;
  // can no longer be met even if every remaining child completes
  const lost = !passed && completed + (expected - completed - failed) < need;
  return { need, ratio, threshold, settled, passed, lost };
};

exports.pct = (v, digits = 1) => `${(v * 100).toFixed(digits).replace(/\.0+$/, "")}%`;

/** Rows of one page of children: [{index, jobId}] (jobId from the run doc when it keeps them) */
exports.childPage = (total, page, size, children) => {
  const start = page * size;
  const end = Math.min(total, start + size);
  const rows = [];
  for (let i = start; i < end; i++) rows.push({ index: i, jobId: children ? children[i] || null : null });
  return { start, end, rows, pages: Math.max(1, Math.ceil(total / size)) };
};

/**
 * One job_status doc per child index from search hits. A retried child has one doc per
 * attempt: take the one the run doc names, else the newest.
 */
exports.pickChildDocs = (hits, children) => {
  const byIndex = {};
  (hits || []).forEach((h) => {
    const src = h._source || {};
    const idx = (src.workflow || {}).child_index;
    if (idx === null || idx === undefined) return;
    const cur = byIndex[idx];
    const isNamed = (doc) => !!children && children[idx] === doc._id;
    if (!cur) byIndex[idx] = h;
    else if (isNamed(cur)) return;
    else if (isNamed(h) || (src["@timestamp"] || "") >= (cur._source["@timestamp"] || "")) byIndex[idx] = h;
  });
  return byIndex;
};

// ---------------------------------------------------------------------------------------
// Job documents: resolved inputs and outputs of a step
// ---------------------------------------------------------------------------------------

/** workflow_outputs [{name, value_s|value_d|value_b, class?}] -> {name: value} (File/Directory kept as objects) */
exports.outputsToDict = (list) => {
  const out = {};
  (Array.isArray(list) ? list : []).forEach((o) => {
    if (!o || !o.name) return;
    const slot = ["value_s", "value_d", "value_b"].find((k) => k in o);
    const v = slot ? o[slot] : null;
    out[o.name] = o.class && typeof v === "string" ? { class: o.class, location: v } : v;
  });
  return out;
};

const INTERNAL_PARAMS = ["container_specification", "job_specification", "localize_urls"];

/** The step's resolved inputs from a job doc's job.params (the params the job spec declares) */
exports.resolvedInputs = (jobDoc) => {
  const params = ((jobDoc || {}).job || {}).params || {};
  const declared = (((params.job_specification || {}).params) || []).map((p) => p.name);
  const out = {};
  Object.keys(params).forEach((k) => {
    if (declared.length ? !declared.includes(k) : k.startsWith("_") || INTERNAL_PARAMS.includes(k)) return;
    out[k] = params[k];
  });
  return out;
};

/**
 * One table for a job step's inputs: the compiled wiring (spec) plus what each input resolved to.
 * ctx: {inputs: resolvedInputs(jobDoc) or null, state, hasAttempt, docsLoaded, scatterInput}
 * Rows: {name, value: {kind: "value"|"placeholder", value?, text?},
 *        sources: [{text, step}] (step is the producing step id, null for workflow inputs),
 *        tags: ["pick: x", "link_merge: y", "default: json"]}
 * Resolved params the spec does not declare are appended with no sources.
 */
exports.mergedInputRows = (specStep, ctx) => {
  const c = ctx || {};
  const inputs = c.inputs || null;
  const ph = (text) => ({ kind: "placeholder", text });
  const noValue = () => {
    if (c.state === "skipped") return ph("skipped");
    if (!c.hasAttempt) return ph(c.state === "cancelled" ? "not submitted" : "pending");
    return ph(c.docsLoaded ? "job document not found" : "loading…");
  };
  const rows = exports.inputRows(specStep).map((r) => {
    let value;
    if (c.scatterInput !== undefined && c.scatterInput !== null) {
      if (r.name === c.scatterInput) value = ph("per child (see children above)");
      else if (r.hasDefault) value = { kind: "value", value: r.default };
      else value = ph("per child");
    } else if (inputs) {
      value = Object.prototype.hasOwnProperty.call(inputs, r.name)
        ? { kind: "value", value: inputs[r.name] }
        : ph("not set");
    } else {
      value = noValue();
    }
    const tags = [];
    if (r.pick) tags.push(`pick: ${r.pick}`);
    if (r.link_merge) tags.push(`link_merge: ${r.link_merge}`);
    if (r.hasDefault) tags.push(`default: ${JSON.stringify(r.default)}`);
    const sources = r.sources.map((s) => {
      const m = /^\$\.([^.]+)\.(.+)$/.exec(s);
      return { text: s, step: m && m[1] !== "inputs" ? m[1] : null };
    });
    return { name: r.name, value, sources, tags };
  });
  if (inputs && !(c.scatterInput)) {
    const known = rows.map((r) => r.name);
    Object.keys(inputs).forEach((k) => {
      if (!known.includes(k)) rows.push({ name: k, value: { kind: "value", value: inputs[k] }, sources: [], tags: [] });
    });
  }
  return rows;
};

exports.jobOutputs = (jobDoc) =>
  exports.outputsToDict((((jobDoc || {}).job || {}).job_info || {}).workflow_outputs);

// ---------------------------------------------------------------------------------------
// Facets and values
// ---------------------------------------------------------------------------------------

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

/** Search body counting, in one request, the docs that have each field (exists filter aggs) */
exports.existsProbeBody = (fields) => ({
  size: 0,
  aggs: fields.reduce((a, f, i) => ({ ...a, [`f${i}`]: { filter: { exists: { field: f } } } }), {}),
});

/** POST the exists probe to a _search URL; resolves to {field: docCount}, rejects on HTTP errors */
exports.probeFieldCounts = (searchUrl, fields) =>
  fetch(searchUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(exports.existsProbeBody(fields)),
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => fields.reduce((a, f, i) => ({ ...a, [f]: data.aggregations[`f${i}`].doc_count }), {}));

// The Jobs (Figaro) page's workflow facets: any facet on a workflow.* field. They are hidden on
// a mission whose job_status has no workflow jobs (pre-workflow indices), where they could
// only ever be empty boxes, unless the URL deep-links to one of them (see jobsUrl).
exports.FIGARO_WORKFLOW_PROBE_FIELD = "workflow.run_id";

const isWorkflowFacet = (f) => typeof f.dataField === "string" && f.dataField.startsWith("workflow.");

/** The Figaro facets to show: the workflow ones only if there are workflow jobs or a deep link */
exports.figaroFilters = (filters, hasWorkflowJobs, search = "") => {
  const params = new URLSearchParams(search);
  const linked = filters.some((f) => isWorkflowFacet(f) && params.has(f.componentId));
  if (hasWorkflowJobs || linked) return filters;
  return filters.filter((f) => !isWorkflowFacet(f));
};

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

/** Counts of job_status docs by status, from a terms agg bucket map */
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

/** Link to the Jobs page, filtered by run (and step). */
exports.jobsUrl = (runId, stepId) => {
  const p = [`workflow_run=${encodeURIComponent(JSON.stringify(runId))}`];
  if (stepId) p.push(`workflow_step=${encodeURIComponent(JSON.stringify(stepId))}`);
  return `/figaro?${p.join("&")}`;
};

/** Link to one job on the Jobs page (a job_status doc id is the job's payload id) */
exports.jobUrl = (jobId) => `/figaro?_id=${encodeURIComponent(JSON.stringify(jobId))}`;
