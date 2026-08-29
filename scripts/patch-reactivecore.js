/**
 * Patches @appbaseio/reactivecore's query engine at install time.
 *
 * Runs from the "postinstall", "prebuild" and "prestart" npm scripts, and is idempotent:
 * re-running it on an already-patched tree is a no-op. If the anchors below are not found
 * exactly once (i.e. reactivecore changed), the script fails loudly so the build stops
 * instead of silently shipping an unpatched bundle.
 *
 * It is deliberately hooked to the build and start scripts as well as to postinstall,
 * because npm 6 running as root -- which is what the Dockerfile does, on node:13 --
 * refuses to run the root package's lifecycle scripts and merely warns:
 *
 *   npm WARN lifecycle hysds_ui@1.3.2~postinstall: cannot run in wd ... (wd=/usr/src/app)
 *
 * The install still exits 0, so relying on postinstall alone would silently produce an
 * unpatched bundle in exactly the environment that builds the production image.
 *
 * WHY THIS EXISTS
 * ---------------
 * reactivesearch is pinned at 3.2.4 (reactivecore 9.0.3) and four defects in its query
 * pipeline leave the results panel showing stale data after a facet change:
 *
 *   1. The query log is written BEFORE the request is sent and is never rolled back on
 *      failure. After any failed search, repeating the same interaction regenerates an
 *      identical query, which the engine then skips as a duplicate -- so re-clicking the
 *      facet does nothing, forever, until a full page reload.
 *   2. Per-item _msearch errors (one sub-query fails, the rest succeed) match neither the
 *      `response.hits` nor the `response.aggregations` branch, so they are swallowed: no
 *      error, no hits update, and the loading flag is never cleared.
 *   3. Responses are ordered by a wall-clock timestamp captured at request time. Two
 *      batches sent in the same millisecond tie, and the strict `<` comparison then drops
 *      the newer response.
 *   4. A component's error state is never cleared once set, so an error indicator would
 *      stay up after a later successful query.
 *
 * None of these are reachable from application code -- nothing exported by reactivesearch
 * can touch `queryLog` or `timestamp` -- hence a patch. Upgrading reactivesearch was
 * rejected: it is pinned exactly, spans every component in both UIs, and changes the
 * transport layer.
 *
 * The target file is a minified single-line build, so each edit below is expressed as an
 * exact anchor string plus its replacement, and the injected code is written out in
 * readable form in the comment above it.
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PKG = "@appbaseio/reactivecore";
const EXPECTED_VERSION = "9.0.3";
const REL_TARGET = path.join("lib", "actions", "query.js");
const MARKER = "_msearchSeq"; // presence => already patched

// Resolve the copy reactivesearch itself would load, not merely the hoisted one. npm
// usually flattens to a single copy, but a version conflict can nest a second under
// @appbaseio/reactivesearch/node_modules -- and patching only the top-level copy would
// then leave the bundled code unpatched while every check here still reported success.
const log = (msg) => console.log(`[patch-reactivecore] ${msg}`);
const fail = (msg) => {
  console.error(`\n[patch-reactivecore] ERROR: ${msg}\n`);
  process.exit(1);
};

const appRoot = path.join(__dirname, "..");
function resolveTarget() {
  const fromReactivesearch = (() => {
    try {
      const rs = require.resolve("@appbaseio/reactivesearch/package.json", {
        paths: [appRoot],
      });
      return require.resolve(`${PKG}/${REL_TARGET.split(path.sep).join("/")}`, {
        paths: [path.dirname(rs)],
      });
    } catch (e) {
      return null;
    }
  })();
  if (fromReactivesearch) return fromReactivesearch;
  return require.resolve(`${PKG}/${REL_TARGET.split(path.sep).join("/")}`, {
    paths: [appRoot],
  });
}

// Resolve the package root separately: a checkout living under a path that itself
// contains "lib/actions" (a CI runner at /var/lib/actions-runner, say) made a substring
// search for it point at the wrong directory entirely.
function resolvePkgDir() {
  try {
    const rs = require.resolve("@appbaseio/reactivesearch/package.json", {
      paths: [appRoot],
    });
    return path.dirname(
      require.resolve(`${PKG}/package.json`, { paths: [path.dirname(rs)] })
    );
  } catch (e) {
    return path.dirname(require.resolve(`${PKG}/package.json`, { paths: [appRoot] }));
  }
}

// Absent entirely (a production-only install) is a legitimate skip; present but not where
// we expect is not -- that must fail loudly rather than quietly ship an unpatched bundle.
let pkgDir;
try {
  pkgDir = resolvePkgDir();
} catch (e) {
  log(`${PKG} not present -- skipping (nothing to patch).`);
  process.exit(0);
}

let target;
try {
  target = resolveTarget();
} catch (e) {
  fail(
    `${PKG} is installed at ${pkgDir}, but ${REL_TARGET} could not be resolved.\n` +
      `  The module layout changed; re-verify the patch against this version.`
  );
}

const version = require(path.join(pkgDir, "package.json")).version;
if (version !== EXPECTED_VERSION) {
  fail(
    `${PKG} is ${version}, but these patches were written for ${EXPECTED_VERSION}.\n` +
      `  Re-verify the fixes against the new version (the upstream defects may be fixed),\n` +
      `  then update EXPECTED_VERSION and the anchors in scripts/patch-reactivecore.js.`
  );
}

let src = fs.readFileSync(target, "utf8");

if (src.includes(MARKER)) {
  log(`${PKG}@${version} already patched -- nothing to do.`);
  process.exit(0);
}

const EDITS = [
  {
    name: "module-level batch sequence counter",
    // Replaces the wall-clock ordering key with a monotonically increasing per-batch
    // sequence number, so two batches sent in the same millisecond can never tie.
    find: "function msearch(query,orderOfQueries){var appendToHits=",
    replace: "var _msearchSeq=0;function msearch(query,orderOfQueries){var appendToHits=",
  },
  {
    name: "per-batch sequence + query-log rollback helper",
    // Injected, in readable form:
    //
    //   var requestSeq = ++_msearchSeq;
    //   var loggedAtDispatch = {};
    //   orderOfQueries.forEach(function (component) {
    //     loggedAtDispatch[component] = getState().queryLog[component];
    //     dispatch(setLoading(component, true));
    //   });
    //   var rollbackQueryLog = function (component) {
    //     // Reference equality: the logged object is replaced wholesale by every
    //     // LOG_QUERY, so an unchanged reference proves no newer query was logged for
    //     // this component since we sent ours -- only then is it ours to roll back.
    //     if (getState().queryLog[component] === loggedAtDispatch[component]) {
    //       dispatch(logQuery(component, { __rolledBack: true }));
    //     }
    //   };
    //
    // The rollback value is a sentinel object rather than null. It only has to compare
    // unequal to every real query (isEqual walks the keys, so it does), and ReactiveList
    // gates its "query changed -> back to page 1" reset on `prevProps.queryLog &&
    // this.props.queryLog` -- a null on either side silently disabled that reset for two
    // updates, leaving page-3 highlighted over page-1 rows.
    //
    // Clearing the log entry is what lets an identical retry re-execute: executeQuery
    // skips a query only when it deep-equals the logged one, and isEqual(query, null)
    // is always false.
    find:
      "orderOfQueries.forEach(function(component){dispatch(setLoading(component,true));});",
    replace:
      "var requestSeq=++_msearchSeq;var loggedAtDispatch={};" +
      "orderOfQueries.forEach(function(component){loggedAtDispatch[component]=getState().queryLog[component];dispatch(setLoading(component,true));});" +
      "var rollbackQueryLog=function rollbackQueryLog(component){" +
      "if(getState().queryLog[component]===loggedAtDispatch[component]){dispatch(logQuery(component,{__rolledBack:true}));}};",
  },
  {
    name: "roll back the query log when the request fails, if still current",
    // handleError already reported the error and cleared the loading flag; it never undid
    // the pre-flight logQuery, which is what wedged the component.
    //
    // It also acted unconditionally, with no notion of which batch it belonged to, so a
    // superseded batch could corrupt newer state in both directions: a slow batch's late
    // rejection painted a failure over newer valid rows (and the banner's own advice --
    // re-click the facet -- was then skipped as a duplicate), and a straggling success
    // could clear a newer batch's legitimate error and install its stale hits, which is
    // strictly worse than unpatched 9.0.3. Both are fenced here:
    //
    //   var superseded =
    //     getState().queryLog[component] !== loggedAtDispatch[component] ||   // newer query logged
    //     !(ts[component] === undefined || ts[component] < requestSeq);       // newer answer seen
    //   if (superseded) return;
    //   dispatch(setTimestamp(component, requestSeq));                        // claim the slot
    //
    // Stamping matters as much as the guard: without it a later straggler sees no
    // timestamp and sails through the success path's ordering check.
    find:
      "var handleError=function handleError(error){console.error(error);orderOfQueries.forEach(function(component){",
    replace:
      "var handleError=function handleError(error){console.error(error);orderOfQueries.forEach(function(component){" +
      "var _st=getState();" +
      "if(_st.queryLog[component]!==loggedAtDispatch[component])return;" +
      "if(!(_st.timestamp[component]===undefined||_st.timestamp[component]<requestSeq))return;" +
      "dispatch(setTimestamp(component,requestSeq));" +
      "rollbackQueryLog(component);",
  },
  {
    name: "surface per-item errors, clear stale ones, order by sequence",
    // Injected, in readable form (replacing the wall-clock guard):
    //
    //   if (timestamp[component] === undefined || timestamp[component] < requestSeq) {
    //     if (response && (response.error ||
    //         (typeof response.status === "number" && response.status >= 400))) {
    //       rollbackQueryLog(component);
    //       dispatch(setTimestamp(component, requestSeq));
    //       if (queryListener[component] && queryListener[component].onError) {
    //         queryListener[component].onError(response.error || response);
    //       }
    //       dispatch(setError(component, response.error || response));
    //       dispatch(setLoading(component, false));
    //       return;
    //     }
    //     // a good response supersedes any error still on screen
    //     if (getState().error[component] != null) {
    //       dispatch(setError(component, null));
    //     }
    //     ...unchanged upstream body...
    find:
      "if(timestamp[component]===undefined||timestamp[component]<res._timestamp){var promotedResults=response.promoted||res.promoted;",
    replace:
      "if(timestamp[component]===undefined||timestamp[component]<requestSeq){" +
      "if(response&&(response.error||typeof response.status==='number'&&response.status>=400)){" +
      "rollbackQueryLog(component);dispatch(setTimestamp(component,requestSeq));" +
      "if(queryListener[component]&&queryListener[component].onError){queryListener[component].onError(response.error||response);}" +
      "dispatch(setError(component,response.error||response));dispatch(setLoading(component,false));return;}" +
      "if(getState().error[component]!=null){dispatch(setError(component,null));}" +
      "var promotedResults=response.promoted||res.promoted;",
  },
  {
    name: "record the sequence number as the ordering key",
    find: "if(response.hits){dispatch(setTimestamp(component,res._timestamp));",
    replace: "if(response.hits){dispatch(setTimestamp(component,requestSeq));",
  },
];

EDITS.forEach((edit) => {
  const occurrences = src.split(edit.find).length - 1;
  if (occurrences !== 1) {
    fail(
      `expected exactly 1 occurrence of the anchor for "${edit.name}", found ${occurrences}.\n` +
        `  ${PKG}@${version} does not look like the build these patches were written for.\n` +
        `  Anchor: ${edit.find.slice(0, 120)}...`
    );
  }
  src = src.split(edit.find).join(edit.replace);
  log(`applied: ${edit.name}`);
});

// The wall clock must no longer be the ordering key anywhere.
if (src.includes("setTimestamp(component,res._timestamp)")) {
  fail("a wall-clock setTimestamp call survived the patch -- aborting.");
}

// Fail before writing if the edits produced anything unparseable.
try {
  new vm.Script(src, { filename: target });
} catch (e) {
  fail(`patched file does not parse: ${e.message}`);
}

fs.writeFileSync(target, src);
log(`patched ${PKG}@${version} (${REL_TARGET}).`);
