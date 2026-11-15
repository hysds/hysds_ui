/**
 * Unit tests for the routing (switch / gate / halt) helpers in src/utils/workflow.js,
 * using the hysds_commons spec fixture and run docs built from the v1.2 contract.
 *
 * Run: npm test
 */
const assert = require("assert");
const w = require("../src/utils/workflow");
const spec = require("./fixtures/spec-switch.json");
const runs = require("./fixtures/runs-switch.json");

// kinds / arms: labels are case name or case_<i>, choices key, "default", gate true/false
assert.ok(w.hasRouting(spec));
assert.ok(!w.hasRouting({ nodes: { A: { kind: "job", next: [] } } }));
assert.ok(!w.hasRouting(null));
assert.deepStrictEqual(
  w.armsOf(spec.nodes.qa_route).map((a) => [a.label, a.target]),
  [["reject", "reject"], ["reprocess", "reprocess_L2SMP"], ["default", "publish"]]
);
assert.deepStrictEqual(
  w.armsOf(spec.nodes.qa_gate).map((a) => [a.label, a.target]),
  [["true", "finish"], ["false", "tier"]]
);
assert.deepStrictEqual(
  w.armsOf(spec.nodes.tier).map((a) => [a.label, a.target]),
  [["gold", "archive_gold"], ["silver", "archive_silver"], ["default", "archive_other"]]
);
assert.deepStrictEqual(
  w.armsOf({ kind: "switch", cases: [{ when: {}, next: ["a"] }, { name: "x", when: {}, next: ["b"] }], default: ["c"] })
    .map((a) => a.label),
  ["case_0", "x", "default"]
);
assert.deepStrictEqual(w.armsOf(spec.nodes.L2SMP), []);
assert.deepStrictEqual(w.armsOf(spec.nodes.reject), []);
assert.deepStrictEqual(w.successors(spec.nodes.qa_route), ["reject", "reprocess_L2SMP", "publish"]);
assert.deepStrictEqual(w.successors({ kind: "switch", choices: { a: ["x"] }, default: ["x"] }), ["x"]);
assert.deepStrictEqual(w.successors(spec.nodes.archive_gold), []);

// conditions read like the spec
assert.strictEqual(w.formatWhen(spec.nodes.qa_route.cases[0].when), "$.L2SMP.qa_score < 0.3");
assert.strictEqual(
  w.formatWhen(spec.nodes.qa_route.cases[1].when),
  "$.L2SMP.qa_score >= 0.3 AND $.L2SMP.qa_score < $.inputs.qa_min"
);
assert.strictEqual(
  w.formatWhen({ any: [{ left: "$.a", op: "eq", right: "x" }, { all: [{ left: "$.b", op: "in", right: [1, 2] }, { not: { left: "$.c", op: "ne", right: null } }] }] }),
  '$.a == "x" OR ($.b in [1,2] AND NOT ($.c != null))'
);
assert.strictEqual(w.armCondition(w.armsOf(spec.nodes.qa_route)[2]), "otherwise");
assert.strictEqual(w.armCondition(w.armsOf(spec.nodes.tier)[0]), '$.inputs.tier == "gold"');
assert.strictEqual(
  w.armCondition(w.armsOf(spec.nodes.qa_gate)[1]),
  "NOT ($.L2SMP.qa_score >= $.inputs.qa_min)"
);
assert.strictEqual(w.errorClassLabel("halted"), "halted (halt node)");
assert.strictEqual(w.errorClassLabel("pge"), "pge");
assert.strictEqual(w.errorClassLabel(undefined), "");

// reading order follows arms and includes every node exactly once
const order = w.orderSpecNodes(spec).map((o) => o.id);
assert.strictEqual(order[0], "L2SMP");
assert.strictEqual(order[1], "qa_route");
assert.strictEqual(order.length, Object.keys(spec.nodes).length);
assert.strictEqual(new Set(order).size, order.length);

// layout: longest-path layers, the rejoin node sits after the longest arm
const g = w.layoutGraph(spec);
const L = {};
g.nodes.forEach((n) => (L[n.id] = n.layer));
assert.strictEqual(L.L2SMP, 0);
assert.strictEqual(L.qa_route, 1);
assert.strictEqual(L.reject, 2);
assert.strictEqual(L.reprocess_L2SMP, 2);
assert.strictEqual(L.pass_pub, 3);
assert.strictEqual(L.publish, 4); // rejoin: default arm (layer 2) and pass_pub (layer 3)
assert.strictEqual(L.qa_gate, 5);
assert.strictEqual(L.archive_gold, 7);
assert.deepStrictEqual(g.edges.filter((e) => e.to === "publish").map((e) => e.from).sort(), ["pass_pub", "qa_route"]);
assert.deepStrictEqual(
  g.edges.filter((e) => e.from === "qa_route").map((e) => e.label),
  ["reject", "reprocess", "default"]
);
// no two nodes share a (layer,row) cell
const cells = g.nodes.map((n) => `${n.layer}:${n.row}`);
assert.strictEqual(new Set(cells).size, cells.length);
g.edges.forEach((e) => assert.ok(L[e.to] > L[e.from], `${e.from}->${e.to} goes forward`));

// scatter graph: scatter -> child -> gather, and linear specs are untouched
const lin = {
  entry: "A",
  nodes: {
    A: { kind: "job", next: ["S"] },
    S: { kind: "scatter", child: "P", next: ["G"] },
    P: { kind: "job", next: [] },
    G: { kind: "gather", next: ["B"] },
    B: { kind: "job", next: [] },
  },
};
assert.ok(!w.hasRouting(lin));
assert.deepStrictEqual(w.orderSpecNodes(lin).map((o) => o.id), ["A", "S", "P", "G", "B"]);
const lg = w.layoutGraph(lin);
assert.deepStrictEqual(lg.nodes.map((n) => n.layer), [0, 1, 2, 3, 4]);
assert.ok(lg.nodes.every((n) => n.row === 0));

// edge state per run
const arm = (run, from, to) =>
  w.edgeState(runs[run], g.edges.find((e) => e.from === from && e.to === to));
assert.strictEqual(arm("default_arm_completed_halt", "qa_route", "publish"), "taken");
assert.strictEqual(arm("default_arm_completed_halt", "qa_route", "reject"), "untaken");
assert.strictEqual(arm("default_arm_completed_halt", "qa_route", "reprocess_L2SMP"), "untaken");
assert.strictEqual(arm("default_arm_completed_halt", "reprocess_L2SMP", "pass_pub"), "untaken");
assert.strictEqual(arm("rejoin_arm_taken", "pass_pub", "publish"), "taken");
assert.strictEqual(arm("rejoin_arm_taken", "qa_route", "publish"), "untaken"); // two incoming arms, one taken
assert.strictEqual(arm("rejoin_arm_taken", "qa_route", "reprocess_L2SMP"), "taken");
assert.strictEqual(arm("failed_halt", "qa_route", "reject"), "taken");
assert.strictEqual(arm("before_switch", "qa_route", "publish"), "open");
assert.strictEqual(arm("running_after_switch", "reprocess_L2SMP", "pass_pub"), "open");
assert.strictEqual(arm("running_after_switch", "qa_route", "publish"), "untaken");
assert.strictEqual(arm("routing_error", "qa_route", "publish"), "open");
// old run doc without any routing fields: nothing is untaken
assert.strictEqual(w.edgeState({ nodes: { A: { state: "completed" }, B: { state: "running" } } }, { from: "A", to: "B" }), "taken");
assert.strictEqual(w.edgeState({}, { from: "A", to: "B" }), "open");

// strip: path actually taken, skipped nodes collapse
const steps = w.orderSpecNodes(spec);
let p = w.pathSteps(runs.default_arm_completed_halt, steps);
assert.deepStrictEqual(p.steps.map((s) => s.id), ["L2SMP", "qa_route", "publish", "qa_gate", "finish"]);
assert.strictEqual(p.skipped.length, 7);
p = w.pathSteps(runs.rejoin_arm_taken, steps);
assert.deepStrictEqual(p.steps.map((s) => s.id), ["L2SMP", "qa_route", "reprocess_L2SMP", "pass_pub", "publish", "qa_gate", "tier", "archive_gold"]);
assert.deepStrictEqual(p.skipped.sort(), ["archive_other", "archive_silver", "finish", "reject"]);
p = w.pathSteps(runs.failed_halt, steps);
assert.deepStrictEqual(p.steps.map((s) => s.id), ["L2SMP", "qa_route", "reject"]);
// pre-1.2 run: identical steps, nothing skipped
const old = w.pathSteps({ nodes: { A: { state: "completed" } } }, w.orderSpecNodes(lin));
assert.strictEqual(old.steps.length, 5);
assert.deepStrictEqual(old.skipped, []);
assert.deepStrictEqual(w.pathSteps({}, []).steps, []);

// default step on the run page: halt node for a failed halt, a job otherwise
assert.strictEqual(w.defaultStep(runs.failed_halt, steps), "reject");
assert.strictEqual(w.defaultStep(runs.routing_error, steps), "qa_route");
assert.strictEqual(w.defaultStep(runs.rejoin_arm_taken, steps), "archive_gold");
assert.strictEqual(w.defaultStep(runs.running_after_switch, steps), "reprocess_L2SMP");

// run docs carry the new error classes
assert.strictEqual(runs.failed_halt.error_class, "halted");
assert.strictEqual(runs.routing_error.error_class, "routing");
assert.strictEqual(runs.default_arm_completed_halt.halt_reason, "high-quality product published");

console.log("workflow-routing: ok");
