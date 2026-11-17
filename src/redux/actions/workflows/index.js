import {
  WORKFLOW_SPEC_LOADING,
  WORKFLOW_SPEC_LOADED,
  WORKFLOW_SPEC_FAILED,
} from "../../constants";

import { MOZART_ES_URL } from "../../../config";
import { WORKFLOW_REST_API } from "../../../config/workflows";

/**
 * Fetch a registered workflow (CWL source + compiled spec) once per "<name>:<version>". A
 * registered workflow is immutable, so a loaded (or in-flight) one is never fetched again.
 * A failed fetch is retried on the next call. The entry holds the whole registry document:
 * {id, version, label, sha256, cwl, cwl_normalized, spec, username, creation_time, ...}.
 */
export const ensureSpec = (specId) => (dispatch, getState) => {
  if (!specId) return Promise.resolve();
  const existing = getState().workflowReducer.specs[specId];
  if (existing && existing.status !== "failed") return Promise.resolve();

  dispatch({ type: WORKFLOW_SPEC_LOADING, id: specId });
  return fetch(`${WORKFLOW_REST_API}/cwl/${encodeURIComponent(specId)}`)
    .then((res) => {
      if (res.status === 404) {
        const err = new Error(`workflow ${specId} is not registered`);
        err.notFound = true;
        throw err;
      }
      if (!res.ok) throw new Error(`workflow ${specId}: HTTP ${res.status}`);
      return res.json();
    })
    .then((data) =>
      dispatch({ type: WORKFLOW_SPEC_LOADED, id: specId, payload: data.result })
    )
    .catch((err) => {
      if (!err.notFound) console.error(err);
      dispatch({ type: WORKFLOW_SPEC_FAILED, id: specId, notFound: !!err.notFound, message: err.message });
    });
};

// plain helpers (not redux actions) for the run page's queries

/** POST an OpenSearch _search body through the /mozart_es proxy; resolves to the response JSON */
export const esSearch = (index, body) =>
  fetch(`${MOZART_ES_URL}/${index}/_search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((res) => {
    if (!res.ok) throw new Error(`search on ${index}: HTTP ${res.status}`);
    return res.json();
  });

/** POST to the workflow REST API; resolves to {ok, status, body} and never throws on HTTP errors */
export const workflowPost = (path, body) =>
  fetch(`${WORKFLOW_REST_API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  }).then((res) =>
    res
      .json()
      .catch(() => ({}))
      .then((json) => ({ ok: res.ok, status: res.status, body: json }))
  );

/** GET from the workflow REST API; resolves to {ok, status, body} and never throws on HTTP errors */
export const workflowGet = (path) =>
  fetch(`${WORKFLOW_REST_API}${path}`).then((res) =>
    res
      .json()
      .catch(() => ({}))
      .then((json) => ({ ok: res.ok, status: res.status, body: json }))
  );
