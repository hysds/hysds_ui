/**
 * Unit tests for the Workflows pages' pure helpers (src/utils/workflow.js), against run
 * documents 2.0 and compiled specs 2.0 (tests/fixtures).
 *
 * Run: npm test
 */
const assert = require("assert");
const w = require("../src/utils/workflow");
const run = require("./fixtures/run-v2.json");
const spec = require("./fixtures/spec-v2.json");

// ---- spec name / version / key
assert.deepStrictEqual(w.parseSpecId("e2e-sg:1.1.0"), { name: "e2e-sg", version: "1.1.0" });
assert.deepStrictEqual(w.parseSpecId("a:b:2"), { name: "a:b", version: "2" });
assert.deepStrictEqual(w.parseSpecId("solo"), { name: "solo", version: "" });
assert.deepStrictEqual(w.runSpec(run), { name: "orbit-l2", version: "1.0.0" });
assert.deepStrictEqual(w.runSpec({ spec_id: "x:1" }), { name: "x", version: "1" });
assert.strictEqual(w.specKey(run), "orbit-l2:1.0.0");
assert.strictEqual(w.cwlUrl("orbit-l2:1.0.0"), "/workflows/cwl/orbit-l2%3A1.0.0");
assert.strictEqual(w.runUser(run), "tester");

// ---- status
assert.ok(w.isLive("running") && w.isLive("halting") && !w.isLive("completed"));
assert.ok(w.isTerminal("cancelled") && !w.isTerminal("halting"));
assert.strictEqual(w.cancelledByText("m2"), "m2");
assert.strictEqual(w.cancelledByText({ username: "u" }), "u");
assert.strictEqual(w.cancelledByText(null), "");

// ---- duration: started_at (else created_at) to ended_at; updated_at for a terminal run; now while live
assert.strictEqual(
  w.runDurationSeconds({ status: "failed", started_at: "2026-11-11T20:00:00Z", ended_at: "2026-11-11T20:01:00Z" }),
  60
);
assert.strictEqual(
  w.runDurationSeconds({ status: "completed", created_at: "2026-11-11T20:00:00Z", updated_at: "2026-11-11T20:00:09Z" }),
  9
);
assert.strictEqual(
  w.runDurationSeconds({ status: "halting", started_at: "2026-11-11T20:00:00Z" }, Date.parse("2026-11-11T20:00:30Z")),
  30
);
assert.strictEqual(w.runDurationSeconds({ status: "running" }), null);
assert.strictEqual(w.spanSeconds("2026-11-11T20:00:00Z", "2026-11-11T20:00:05Z"), 5);
assert.strictEqual(w.spanSeconds(null, null), null);
assert.strictEqual(w.formatDuration(5), "5s");
assert.strictEqual(w.formatDuration(125), "2m05s");
assert.strictEqual(w.formatDuration(3 * 3600 + 120), "3h02m");
assert.strictEqual(w.formatDuration(null), "-");
assert.strictEqual(w.shortTime("2026-11-11T20:07:44.123Z"), "11-11 20:07:44");
assert.strictEqual(w.shortTime(null), "-");

// ---- refs and deps
assert.strictEqual(w.refStep("$.qa.deliver"), "qa");
assert.strictEqual(w.refStep("$.inputs.orbit_id"), null);
assert.strictEqual(w.refStep("literal"), null);
assert.deepStrictEqual(w.stepDeps(spec.steps.deliver), ["qa", "browse"]);
// no stored deps: derived from `in` sources plus the `when` flag, workflow inputs are not deps
assert.deepStrictEqual(
  w.stepDeps({
    in: { a: { source: ["$.x.o", "$.inputs.i"] }, b: { source: ["$.y.o"] }, c: { default: 1 } },
    when: "$.z.flag",
  }),
  ["x", "y", "z"]
);

// ---- merging spec and run, and the graph
const merged = w.mergeSteps(run, spec);
assert.deepStrictEqual(merged.map((s) => s.id), ["find", "l1a", "qa", "browse", "deliver", "reject"]);
const by = (id) => merged.find((s) => s.id === id);
assert.strictEqual(by("reject").kind, "halt");
assert.strictEqual(by("deliver").kind, "job");
assert.strictEqual(by("deliver").when, "$.qa.deliver");
assert.strictEqual(by("deliver").state, "skipped");
assert.ok(by("l1a").scatter && !by("qa").scatter);
assert.strictEqual(by("find").jobType, "job-find:v1");

// without the spec only the run doc's steps are known: no deps, no edges, still in doc order
const noSpec = w.mergeSteps(run, null);
assert.deepStrictEqual(noSpec.map((s) => s.id), ["find", "l1a", "qa", "browse", "deliver", "reject"]);
assert.strictEqual(noSpec.find((s) => s.id === "reject").kind, "halt");
assert.strictEqual(w.layoutGraph(noSpec).edges.length, 0);
assert.strictEqual(w.layoutGraph(noSpec).layers, 1);
// a step the spec does not know (a spec/run mismatch) is appended rather than dropped
assert.strictEqual(w.mergeSteps({ steps: { extra: { state: "waiting" } } }, spec).pop().id, "extra");

const g = w.layoutGraph(merged);
const layer = (id) => g.nodes.find((n) => n.id === id).layer;
assert.deepStrictEqual(["find", "l1a", "qa", "browse", "deliver"].map(layer), [0, 1, 2, 2, 3]);
assert.strictEqual(layer("reject"), 3);
// qa and browse run in parallel: same layer, different rows
assert.notStrictEqual(g.nodes.find((n) => n.id === "qa").row, g.nodes.find((n) => n.id === "browse").row);
assert.strictEqual(g.layers, 4);
assert.strictEqual(g.edges.length, 6);
const gate = g.edges.filter((e) => e.gate).map((e) => `${e.from}>${e.to}`).sort();
assert.deepStrictEqual(gate, ["qa>deliver", "qa>reject"]);

// ---- edge states: skipped/cancelled endpoints mean nothing flowed
const E = (from, to) => w.edgeState(run, { from, to });
assert.strictEqual(E("find", "l1a"), "taken");
assert.strictEqual(E("qa", "deliver"), "untaken"); // deliver was skipped
assert.strictEqual(E("browse", "deliver"), "untaken");
assert.strictEqual(E("qa", "reject"), "taken");
assert.strictEqual(E("browse", "nowhere"), "open");

// ---- default step: failed_step, then failed/running, then the halt that fired
assert.strictEqual(w.defaultStep({ failed_step: "l1a", steps: run.steps }, merged), "l1a");
assert.strictEqual(w.defaultStep(run, merged), "browse");
const quiet = { ...run, steps: { ...run.steps, browse: { ...run.steps.browse, state: "completed" } } };
assert.strictEqual(w.defaultStep(quiet, w.mergeSteps(quiet, spec)), "reject");
assert.strictEqual(w.defaultStep(null, merged), null);

// ---- halt and reasons
assert.deepStrictEqual(w.haltedBy(run), { step: "reject", status: "failed", reason: "failed QA" });
assert.strictEqual(w.haltedBy({ steps: { reject: { kind: "halt", halt: { fired: false } } } }), null);
assert.deepStrictEqual(w.stepReasons(run.steps.deliver), [
  { kind: "skipped", text: "skipped: when $.qa.deliver was false" },
]);
assert.deepStrictEqual(w.stepReasons(run.steps.reject).map((r) => r.kind), ["halt-fired"]);
assert.ok(w.stepReasons(run.steps.reject)[0].text.includes("failed QA"));
const cancel = (c) => w.stepReasons({ cancelled_by: c })[0].text;
assert.strictEqual(cancel({ kind: "user", step: null, reason: "cancelled by m2" }), "cancelled by the user: cancelled by m2");
assert.strictEqual(cancel({ kind: "failure", step: "l1a" }), "cancelled because step l1a failed");
assert.strictEqual(cancel({ kind: "halt", step: "reject", reason: "failed QA" }), "cancelled by the halt in step reject: failed QA");
assert.strictEqual(cancel({ kind: "upstream_failed", step: "a" }), "not started: it depends on failed step a");
assert.deepStrictEqual(w.stepReasons({ error: "boom", error_class: "exit_code:2" }), [
  { kind: "error", text: "(exit_code:2) boom" },
]);
assert.deepStrictEqual(w.stepReasons(undefined), []);
assert.strictEqual(w.displayState({ state: "waiting" }), "pending");
assert.strictEqual(w.displayState(undefined), "pending");
assert.strictEqual(w.errorClassLabel("scatter_threshold").startsWith("scatter threshold"), true);
assert.strictEqual(w.errorClassLabel("exit_code:3"), "exit_code:3");

// ---- compiled input rows
const rows = w.inputRows(spec.steps.qa).concat(w.inputRows(spec.steps.deliver));
assert.deepStrictEqual(rows[0], {
  name: "x", sources: ["$.l1a.l1a_file"], link_merge: "merge_flattened", pick: "all_non_null", hasDefault: false, default: undefined,
});
const prio = rows.find((r) => r.name === "prio");
assert.deepStrictEqual([prio.sources, prio.hasDefault, prio.default], [[], true, "normal"]);
assert.deepStrictEqual(w.inputRows(null), []);

// ---- scatter progress and threshold
const p = w.scatterProgress(run.steps.l1a);
assert.deepStrictEqual(
  { e: p.expected, c: p.completed, f: p.failed, a: p.active, t: p.threshold },
  { e: 10, c: 9, f: 1, a: 0, t: 0.9 }
);
assert.strictEqual(w.scatterProgress(run.steps.find), null);
const tr = w.thresholdResult(p);
assert.deepStrictEqual(
  { need: tr.need, settled: tr.settled, passed: tr.passed, lost: tr.lost },
  { need: 9, settled: true, passed: true, lost: false }
);
// 8/10 against 0.9: failed once settled
const bad = w.thresholdResult({ expected: 10, completed: 8, failed: 2, threshold: 0.9 });
assert.deepStrictEqual([bad.passed, bad.settled, bad.lost], [false, true, true]);
// still running, 5 done 3 failed 2 active: cannot reach 9 any more
assert.strictEqual(w.thresholdResult({ expected: 10, completed: 5, failed: 3, threshold: 0.9 }).lost, true);
// still running and can still pass
const open = w.thresholdResult({ expected: 10, completed: 5, failed: 0, threshold: 0.9 });
assert.deepStrictEqual([open.passed, open.settled, open.lost], [false, false, false]);
// an empty scatter completes; floating point does not turn 0.95 * 20 into 19.0000001
assert.strictEqual(w.thresholdResult({ expected: 0, completed: 0, failed: 0, threshold: 1 }).passed, true);
assert.strictEqual(w.thresholdResult({ expected: 20, completed: 19, failed: 1, threshold: 0.95 }).passed, true);
assert.strictEqual(w.thresholdResult({ expected: 20, completed: 19, failed: 1, threshold: 0.95 }).need, 19);
assert.strictEqual(w.thresholdResult({ expected: null, completed: 0, failed: 0, threshold: 1 }), null);
assert.strictEqual(w.pct(0.95), "95%");
assert.strictEqual(w.pct(0.9725), "97.3%");
assert.strictEqual(w.pct(1), "100%");

// ---- child paging: the doc keeps child ids (null = not submitted yet) only up to a cap
const page1 = w.childPage(10, 1, 4, run.steps.l1a.scatter.children);
assert.deepStrictEqual([page1.start, page1.end, page1.pages], [4, 8, 3]);
assert.deepStrictEqual(page1.rows.map((r) => r.jobId), ["c4", "c5", "c6", "c7"]);
const last = w.childPage(10, 2, 4, null);
assert.deepStrictEqual(last.rows.map((r) => [r.index, r.jobId]), [[8, null], [9, null]]);
assert.strictEqual(w.childPage(0, 0, 25, null).pages, 1);
assert.strictEqual(w.childPage(1000000, 0, 25, null).pages, 40000);

// a retried child has one job doc per attempt: the run doc's id wins, else the newest
const hit = (id, idx, ts) => ({ _id: id, _source: { "@timestamp": ts, workflow: { child_index: idx } } });
const docs = w.pickChildDocs(
  [hit("old", 3, "2026-11-17T04:00:00Z"), hit("new", 3, "2026-11-17T04:01:00Z"), hit("x", 4, "t"), hit("nochild", null, "t")],
  null
);
assert.deepStrictEqual(Object.keys(docs).sort(), ["3", "4"]);
assert.strictEqual(docs[3]._id, "new");
const named = w.pickChildDocs([hit("new", 3, "2026-11-17T04:01:00Z"), hit("old", 3, "2026-11-17T04:00:00Z")], { 3: "old" });
assert.strictEqual(named[3]._id, "old");

// ---- job docs: outputs and resolved inputs
assert.deepStrictEqual(
  w.outputsToDict([
    { name: "n", value_d: 3 },
    { name: "s", value_s: "x" },
    { name: "b", value_b: false },
    { name: "f", class: "File", value_s: "s3://b/k.h5" },
    { name: "l", value_s: ["a", "b"] },
    { name: "empty" },
  ]),
  { n: 3, s: "x", b: false, f: { class: "File", location: "s3://b/k.h5" }, l: ["a", "b"], empty: null }
);
assert.deepStrictEqual(w.outputsToDict(undefined), {});
const jobDoc = {
  job: {
    params: {
      mode: "ok",
      _command: "/x",
      localize_urls: [],
      container_specification: {},
      job_specification: { params: [{ name: "mode" }, { name: "sleep" }] },
      sleep: "5",
    },
    job_info: { workflow_outputs: [{ name: "result", value_s: "A" }] },
  },
};
assert.deepStrictEqual(w.resolvedInputs(jobDoc), { mode: "ok", sleep: "5" });
assert.deepStrictEqual(w.jobOutputs(jobDoc), { result: "A" });
// without a declared param list, internals are dropped
assert.deepStrictEqual(w.resolvedInputs({ job: { params: { a: 1, _x: 2, job_specification: {}, localize_urls: [] } } }), { a: 1 });
assert.deepStrictEqual(w.resolvedInputs(null), {});

// ---- links and values
assert.strictEqual(w.toLink("s3://bkt/a/b.h5"), "https://bkt.s3.amazonaws.com/a/b.h5");
assert.strictEqual(w.toLink("https://x.org/y"), "https://x.org/y");
assert.strictEqual(w.toLink("plain"), null);
assert.strictEqual(w.toLink(5), null);
assert.strictEqual(w.fileLocation({ class: "File", location: "s3://b/k" }), "s3://b/k");
assert.strictEqual(w.fileLocation({ class: "Other", location: "x" }), null);
assert.strictEqual(w.fileLocation([1]), null);
assert.strictEqual(w.jobsUrl("run-1"), "/figaro?workflow_run=%22run-1%22");
assert.strictEqual(w.jobsUrl("run-1", "a"), "/figaro?workflow_run=%22run-1%22&workflow_step=%22a%22");
assert.strictEqual(w.jobUrl("abc-1"), "/figaro?_id=%22abc-1%22");
assert.deepStrictEqual(
  w.summarizeStatuses({ "job-completed": 3, "job-failed": 1, "job-offline": 1, "job-revoked": 2, "job-queued": 1, "job-started": 1 }),
  { total: 9, completed: 3, failed: 2, revoked: 2, active: 2 }
);

// ---- facets switch on only when the field has data
const cands = [
  { componentId: "a", candidates: ["x", "y"], title: "A" },
  { componentId: "b", candidates: ["z"], title: "B" },
];
assert.deepStrictEqual(w.resolveFilters(cands, { x: 0, y: 4, z: 0 }), [{ componentId: "a", title: "A", dataField: "y" }]);
assert.deepStrictEqual(w.candidateFields(cands, ["y", "q"]), ["x", "y", "z", "q"]);

// ---- exists probe (Workflows facets, Figaro workflow facets)
assert.deepStrictEqual(w.existsProbeBody(["a", "b.c"]), {
  size: 0,
  aggs: { f0: { filter: { exists: { field: "a" } } }, f1: { filter: { exists: { field: "b.c" } } } },
});

// ---- Figaro: workflow facets hidden without workflow jobs, unless deep-linked
const figFilters = [
  { componentId: "status", dataField: "status" },
  { componentId: "workflow_run", dataField: "workflow.run_id" },
  { componentId: "workflow_step", dataField: "workflow.step_id" },
  { componentId: "workflow_spec", dataField: "workflow.spec_id" },
];
const ids = (fs) => fs.map((f) => f.componentId);
assert.deepStrictEqual(ids(w.figaroFilters(figFilters, false, "")), ["status"]);
assert.deepStrictEqual(ids(w.figaroFilters(figFilters, false)), ["status"]);
assert.deepStrictEqual(ids(w.figaroFilters(figFilters, false, "?status=%22job-failed%22")), ["status"]);
assert.deepStrictEqual(ids(w.figaroFilters(figFilters, true, "")), ids(figFilters));
assert.deepStrictEqual(ids(w.figaroFilters(figFilters, false, w.jobsUrl("run-1").split("/figaro")[1])), ids(figFilters));
assert.deepStrictEqual(ids(w.figaroFilters(figFilters, false, "?workflow_step=%22s1%22")), ids(figFilters));
// a deployment's own figaro.js without workflow facets is left as it is
assert.deepStrictEqual(w.figaroFilters(figFilters.slice(0, 1), false, ""), figFilters.slice(0, 1));

// ---- probeFieldCounts: one exists-agg request, counts per field; HTTP errors reject
const probeTests = (() => {
  const sent = [];
  global.fetch = (url, opts) => {
    sent.push({ url, body: JSON.parse(opts.body) });
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ aggregations: { f0: { doc_count: 0 }, f1: { doc_count: 7 } } }),
    });
  };
  return w
    .probeFieldCounts("/es/job_status/_search", ["workflow.run_id", "status"])
    .then((counts) => {
      assert.deepStrictEqual(counts, { "workflow.run_id": 0, status: 7 });
      assert.strictEqual(sent[0].url, "/es/job_status/_search");
      assert.deepStrictEqual(sent[0].body, w.existsProbeBody(["workflow.run_id", "status"]));
      global.fetch = () => Promise.resolve({ ok: false, status: 404 });
      return w.probeFieldCounts("/es/x/_search", ["a"]).then(
        () => assert.fail("expected a rejection"),
        (err) => assert.strictEqual(err.message, "HTTP 404")
      );
    })
    .finally(() => delete global.fetch);
})();

probeTests
  .then(() => console.log("workflow-utils tests passed"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
