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

/**
 * Lay a spec's nodes out in reading order: from `entry`, following `next`; a scatter's
 * `child` comes straight after the scatter node. Unreachable nodes are appended.
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
    (node.next || []).forEach(visit);
  };

  visit(spec.entry);
  Object.keys(nodes).forEach(visit);
  return out;
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
