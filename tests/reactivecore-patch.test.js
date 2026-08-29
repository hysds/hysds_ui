/**
 * Regression tests for the reactivecore query-engine patch (scripts/patch-reactivecore.js).
 *
 * These drive a real redux store built from reactivecore's own reducers and actions, with
 * only the network layer (appbaseRef.msearch) faked, so the full executeQuery -> msearch ->
 * handleResponse pipeline runs exactly as it does in the browser.
 *
 * Run: npm test
 *
 * Every test here FAILS against unpatched reactivecore@9.0.3 -- that is the point. To see
 * the pre-fix behaviour, restore the pristine file from a fresh `npm install` of
 * @appbaseio/reactivecore (without running the postinstall patch) and re-run.
 */

const assert = require("assert");
const { createStore, applyMiddleware } = require("redux");
const thunk = require("redux-thunk").default;

const Reducers = require("@appbaseio/reactivecore/lib/reducers").default;
const {
  addComponent,
  watchComponent,
  setQueryOptions,
  updateQuery,
} = require("@appbaseio/reactivecore/lib/actions");

const FACET = "dataset"; // a sidebar filter
const RESULTS = "results"; // ToscaResultsList
const RESULTS_2 = "results-2"; // a second component in the same batch

// ---------------------------------------------------------------- harness

function makeStore() {
  const sent = []; // one entry per msearch call: { body, resolve, reject }
  const appbaseRef = {
    setHeaders() {},
    msearch({ body }) {
      return new Promise((resolve, reject) => sent.push({ body, resolve, reject }));
    },
  };

  const store = createStore(
    Reducers,
    {
      config: {
        url: "http://localhost:9200",
        app: "grq",
        type: "*",
        credentials: null,
        analytics: false,
        analyticsConfig: {},
      },
      appbaseRef,
    },
    applyMiddleware(thunk)
  );

  // Mirrors how the pages wire up: the results list(s) react to the facet.
  store.dispatch(addComponent(FACET));
  [RESULTS, RESULTS_2].forEach((id) => {
    store.dispatch(addComponent(id));
    store.dispatch(watchComponent(id, { and: [FACET] }));
    store.dispatch(setQueryOptions(id, { size: 10, from: 0 }, false));
  });

  // Clicking a facet value, exactly as MultiList/SingleList do it.
  const clickFacet = (value) =>
    store.dispatch(
      updateQuery({
        componentId: FACET,
        query: { term: { "dataset.keyword": value } },
        value,
      })
    );

  return { store, sent, clickFacet };
}

const tick = () => new Promise((r) => setImmediate(r));

const hitsBody = (total, stamp) => ({
  _timestamp: stamp,
  responses: [
    { hits: { hits: [], total, max_score: null }, took: 3, status: 200 },
    { hits: { hits: [], total, max_score: null }, took: 3, status: 200 },
  ],
});

// reactivecore logs every failed request via console.error; these tests provoke those
// failures deliberately, so keep the real stderr for our own reporting and mute the rest.
const stderr = console.error.bind(console);
console.error = () => {};

let failures = 0;
async function test(name, fn) {
  try {
    await fn();
    console.log(`  ok  ${name}`);
  } catch (e) {
    failures += 1;
    stderr(`FAIL  ${name}\n      ${e.message}`);
  }
}

// ---------------------------------------------------------------- tests

async function main() {
  console.log("reactivecore query-engine patch regression tests\n");

  await test("the installed reactivecore is patched", async () => {
    const fs = require("fs");
    const target = require.resolve("@appbaseio/reactivecore/lib/actions/query.js");
    assert.ok(
      fs.readFileSync(target, "utf8").includes("_msearchSeq"),
      "@appbaseio/reactivecore is not patched -- run `node scripts/patch-reactivecore.js` " +
        "(npm install does this automatically via the postinstall script)"
    );
  });

  await test("sanity: a facet click issues one msearch for the reacting components", async () => {
    const { sent, clickFacet } = makeStore();
    clickFacet("L0B");
    assert.strictEqual(sent.length, 1, "expected exactly one msearch batch");
    const preferences = sent[0].body
      .filter((line) => line && line.preference)
      .map((line) => line.preference);
    assert.deepStrictEqual(preferences, [RESULTS, RESULTS_2]);
  });

  await test("RC1: a failed request rolls back the query log, so an identical retry re-queries", async () => {
    const { store, sent, clickFacet } = makeStore();

    clickFacet("L0B");
    assert.strictEqual(sent.length, 1);
    assert.ok(store.getState().queryLog[RESULTS], "query should be logged pre-flight");

    sent[0].reject(new Error("Failed to fetch"));
    await tick();

    assert.strictEqual(
      store.getState().queryLog[RESULTS],
      null,
      "query log must be rolled back after a failed request"
    );
    assert.ok(store.getState().error[RESULTS], "error state should be set");
    assert.strictEqual(store.getState().isLoading[RESULTS], false, "loading must be cleared");

    // The user's recovery gesture: un-click and re-click the same facet value, which
    // regenerates a byte-identical query. Unpatched, this is skipped as a duplicate and
    // the panel stays stale forever.
    clickFacet("L0B");
    assert.strictEqual(sent.length, 2, "identical retry after a failure must re-execute");
  });

  await test("RC2: a per-item _msearch error surfaces instead of being swallowed", async () => {
    const { store, sent, clickFacet } = makeStore();

    clickFacet("L0B");
    // Realistic partial failure: appbase-js only rejects when EVERY item errored, so a
    // batch like this resolves and lands in handleResponse.
    sent[0].resolve({
      _timestamp: Date.now(),
      responses: [
        { error: { type: "search_phase_execution_exception", reason: "all shards failed" }, status: 503 },
        { hits: { hits: [], total: 7, max_score: null }, took: 2, status: 200 },
      ],
    });
    await tick();

    const state = store.getState();
    assert.ok(state.error[RESULTS], "failing component must report an error");
    assert.strictEqual(state.isLoading[RESULTS], false, "failing component must clear loading");
    assert.strictEqual(state.queryLog[RESULTS], null, "failing component's query log must roll back");
    assert.ok(!state.hits[RESULTS], "failing component must not be given hits");

    // ...while the component that succeeded in the same batch is unaffected.
    assert.ok(!state.error[RESULTS_2], "succeeding component must not be marked failed");
    assert.strictEqual(state.hits[RESULTS_2].total, 7, "succeeding component must get its hits");

    // And the failed one recovers on the next identical interaction.
    clickFacet("L0B");
    assert.strictEqual(sent.length, 2, "component must be able to retry after a per-item error");
  });

  await test("RC3: same-millisecond batches order by sequence, so the newer response wins", async () => {
    const { store, sent, clickFacet } = makeStore();

    clickFacet("L0B"); // older query
    clickFacet("L1"); // newer query
    assert.strictEqual(sent.length, 2, "two distinct queries should produce two batches");

    // Both batches were built in the same millisecond -- the wall-clock ordering key ties,
    // and the strict `<` comparison then discards whichever response lands second, even
    // though it answers the newer query.
    const sameMillisecond = Date.now();
    sent[0].resolve(hitsBody(111, sameMillisecond));
    await tick();
    sent[1].resolve(hitsBody(222, sameMillisecond));
    await tick();

    assert.strictEqual(
      store.getState().hits[RESULTS].total,
      222,
      "results must reflect the newer query, not the earlier one"
    );
  });

  // Unlike the case above, this direction already worked before the patch (an accepted
  // response bumps the ordering key, so a straggler is rejected). It is kept as a guard
  // that switching the key from wall clock to sequence did not regress it.
  await test("RC3: a late response from a superseded query cannot overwrite newer results", async () => {
    const { store, sent, clickFacet } = makeStore();

    clickFacet("L0B");
    clickFacet("L1");

    const sameMillisecond = Date.now();
    sent[1].resolve(hitsBody(222, sameMillisecond)); // newer lands first
    await tick();
    sent[0].resolve(hitsBody(111, sameMillisecond)); // older straggles in
    await tick();

    assert.strictEqual(
      store.getState().hits[RESULTS].total,
      222,
      "a stale response must not clobber newer results"
    );
  });

  await test("recovery: a successful response clears a previously-set error", async () => {
    const { store, sent, clickFacet } = makeStore();

    clickFacet("L0B");
    sent[0].reject(new Error("Failed to fetch"));
    await tick();
    assert.ok(store.getState().error[RESULTS], "precondition: error is set");

    clickFacet("L0B");
    sent[1].resolve(hitsBody(5, Date.now()));
    await tick();

    assert.strictEqual(
      store.getState().error[RESULTS],
      null,
      "error must be cleared once a query succeeds again"
    );
    assert.strictEqual(store.getState().hits[RESULTS].total, 5);
  });

  console.log(
    failures === 0 ? "\nall tests passed\n" : `\n${failures} test(s) failed\n`
  );
  process.exit(failures === 0 ? 0 : 1);
}

main();
