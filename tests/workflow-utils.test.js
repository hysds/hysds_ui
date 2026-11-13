/**
 * Unit tests for the Workflows pages' pure helpers (src/utils/workflow.js), focused on
 * the fallbacks used while the backend has not written the newer run fields yet.
 *
 * Run: npm test
 */
const assert = require("assert");
const w = require("../src/utils/workflow");

// spec name/version fall back to spec_id, and prefer the real fields when present
assert.deepStrictEqual(w.parseSpecId("e2e-sg:1.1.0"), { name: "e2e-sg", version: "1.1.0" });
assert.deepStrictEqual(w.parseSpecId("a:b:2"), { name: "a:b", version: "2" });
assert.deepStrictEqual(w.runSpec({ spec_id: "x:1" }), { name: "x", version: "1" });
assert.deepStrictEqual(w.runSpec({ spec_id: "x:1", spec_name: "y", spec_version: "2" }), {
  name: "y",
  version: "2",
});

// user falls back to the legacy `user` field
assert.strictEqual(w.runUser({ user: "old" }), "old");
assert.strictEqual(w.runUser({ user: "old", username: "new" }), "new");

// duration: duration_s, else ended_at, else updated_at (terminal), else now
const base = { submitted_at: "2026-11-11T20:00:00Z" };
assert.strictEqual(w.runDurationSeconds({ ...base, duration_s: 5 }), 5);
assert.strictEqual(
  w.runDurationSeconds({ ...base, status: "failed", ended_at: "2026-11-11T20:01:00Z" }),
  60
);
assert.strictEqual(
  w.runDurationSeconds({ ...base, status: "failed", updated_at: "2026-11-11T20:02:00Z" }),
  120
);
assert.strictEqual(
  w.runDurationSeconds({ ...base, status: "running" }, Date.parse("2026-11-11T20:00:30Z")),
  30
);
assert.strictEqual(w.formatDuration(134), "2m14s");
assert.strictEqual(w.formatDuration(null), "-");

// spec order: scatter child directly after the scatter node, then the scatter's next
const spec = {
  entry: "A",
  nodes: {
    G: { kind: "gather", next: ["B"] },
    A: { kind: "job", next: ["S"] },
    B: { kind: "job", next: [] },
    P: { kind: "job", next: [] },
    S: { kind: "scatter", child: "P", next: ["G"] },
  },
};
const order = w.orderSpecNodes(spec);
assert.deepStrictEqual(order.map((o) => o.id), ["A", "S", "P", "G", "B"]);
assert.deepStrictEqual(order.filter((o) => o.isChild).map((o) => o.id), ["P"]);

// facets: first candidate with data wins, no data hides the facet
const cands = [
  { componentId: "spec", candidates: ["spec_name", "spec_id"] },
  { componentId: "failed_node", candidates: ["failed_node"] },
];
assert.deepStrictEqual(
  w.resolveFilters(cands, { spec_name: 0, spec_id: 5, failed_node: 0 }).map((f) => f.dataField),
  ["spec_id"]
);
assert.deepStrictEqual(
  w.resolveFilters(cands, { spec_name: 2, spec_id: 5, failed_node: 1 }).map((f) => f.dataField),
  ["spec_name", "failed_node"]
);

// links
assert.strictEqual(w.toLink("s3://b/k/x.json"), "https://b.s3.amazonaws.com/k/x.json");
assert.strictEqual(w.toLink("hello"), null);
assert.strictEqual(w.fileLocation({ class: "File", location: "s3://b/k" }), "s3://b/k");
assert.strictEqual(w.fileLocation({ location: "s3://b/k" }), null);
assert.strictEqual(
  decodeURIComponent(w.jobsUrl("run-1", "P")),
  '/figaro?workflow_run="run-1"&workflow_step="P"'
);

// first step to show
const ordered = w.orderSpecNodes(spec);
assert.strictEqual(w.defaultStep({ failed_node: "G", nodes: {} }, ordered), "G");
assert.strictEqual(w.defaultStep({ nodes: { B: { state: "failed" } } }, ordered), "B");
assert.strictEqual(w.defaultStep({ nodes: { A: { state: "completed" } } }, ordered), "P");

console.log("workflow-utils: ok");
