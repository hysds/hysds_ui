/**
 * Render smoke tests for the pure workflow components (the step graph, the step strip on the
 * list cards, the legend and the value tree): server-side render against the fixture run and
 * spec and look at the markup. Components that fetch (the run page, the scatter children
 * table) are not rendered here; their data logic lives in src/utils/workflow.js.
 *
 * Run: npm test
 */
const assert = require("assert");
const fs = require("fs");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const babel = require("@babel/core");
require("ignore-styles");

// compile .jsx on require (the app is built by webpack + babel-loader, with the same .babelrc)
require.extensions[".jsx"] = (module, filename) => {
  const out = babel.transformSync(fs.readFileSync(filename, "utf8"), { filename });
  module._compile(out.code, filename);
};

const w = require("../src/utils/workflow");
const WorkflowGraph = require("../src/components/WorkflowGraph").default;
const WorkflowStepStrip = require("../src/components/WorkflowStepStrip").default;
const { StateLegend, StatusBadge, ValueView } = require("../src/components/WorkflowCommon");
const run = require("./fixtures/run-v2.json");
const spec = require("./fixtures/spec-v2.json");

const html = (el) => renderToStaticMarkup(el);
const count = (s, re) => (s.match(re) || []).length;

// ---- graph: one box per step, one edge per dep, when tags only on gated steps
const merged = w.mergeSteps(run, spec);
const g = html(React.createElement(WorkflowGraph, { run, merged, selected: "qa" }));
assert.strictEqual(count(g, /class="wfg-node /g), 6);
assert.strictEqual(count(g, /class="wfg-edge /g), 6);
assert.strictEqual(count(g, /wfg-edge-gate/g), 2); // qa -> deliver and qa -> reject supply `when` flags
assert.strictEqual(count(g, /class="wfg-when-tag"/g), 2); // deliver and reject are gated
assert.ok(/wfg-node wf-state-skipped wfg-kind-job[^"]*wfg-gated/.test(g), "deliver is skipped and gated");
assert.ok(/wfg-node wf-state-completed wfg-kind-halt wfg-halt-failed wfg-halt-fired/.test(g), "the halt step fired");
assert.ok(g.includes("wfg-selected"));
assert.ok(g.includes("when $.qa.deliver"));
assert.ok(g.includes("skipped: when was false"));
assert.ok(g.includes("9/10 done · 1 failed"), "scatter progress on the l1a node");
assert.ok(g.includes("HALT failed (fired)"));
assert.ok(/wfg-edge-untaken/.test(g), "edges into the skipped step are dimmed");
assert.ok(/wfg-edge-taken/.test(g));
// the same graph without the registered spec: boxes only, no edges, nothing throws
const bare = html(React.createElement(WorkflowGraph, { run, merged: w.mergeSteps(run, null) }));
assert.strictEqual(count(bare, /class="wfg-node /g), 6);
assert.strictEqual(count(bare, /class="wfg-edge /g), 0);
// a halting run with a waiting step renders the pending state, not "waiting"
const waiting = { ...run, steps: { ...run.steps, deliver: { ...run.steps.deliver, state: "waiting", skipped_by: undefined } } };
assert.ok(html(React.createElement(WorkflowGraph, { run: waiting, merged: w.mergeSteps(waiting, spec) })).includes("wf-state-pending"));

// ---- strip on the list cards (run doc only)
const strip = html(React.createElement(WorkflowStepStrip, { run }));
assert.strictEqual(count(strip, /wf-step wf-step-/g), 6);
assert.ok(strip.includes("wf-step-bar"), "the scattered step is a bar");
assert.ok(strip.includes("9/10 1✗"));
assert.ok(strip.includes("wf-step-halt-failed"));
assert.ok(/wf-step-chip wf-state-skipped/.test(strip));
assert.ok(/wf-step-chip wf-state-running/.test(strip));

// ---- legend, badges, value tree
const legend = html(React.createElement(StateLegend));
["pending", "queued", "running", "completed", "failed", "skipped", "cancelled"].forEach((s) =>
  assert.ok(legend.includes(`wf-state-${s}`), `legend has ${s}`)
);
assert.ok(!/switch|\barm\b|\bgate\b/.test(legend), "no v1 routing in the legend");
assert.ok(html(React.createElement(StatusBadge, { status: "halting" })).includes("HALTING"));
assert.ok(html(React.createElement(StatusBadge, { status: "job-completed" })).includes(">COMPLETED<"));
const tree = html(React.createElement(ValueView, { value: { f: { class: "File", location: "s3://b/k.h5" }, n: null } }));
assert.ok(tree.includes('href="https://b.s3.amazonaws.com/k.h5"'));
assert.ok(tree.includes("wf-null"));

console.log("workflow-render tests passed");
