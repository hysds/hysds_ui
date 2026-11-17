import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

import { esSearch } from "../../redux/actions/workflows";
import { JOB_STATUS_INDEX } from "../../config/workflows";
import { StatusBadge, ValueView } from "../WorkflowCommon";
import {
  childPage,
  pickChildDocs,
  jobOutputs,
  jobUrl,
  pct,
  thresholdResult,
} from "../../utils/workflow";

import "../WorkflowCommon/style.css";
import "./style.css";

export const PAGE_SIZE = 25;
const FETCH_CAP = 200; // docs per page query (a retried child has one doc per attempt)

// server-side filters: a status filter pages over the matching docs, `all` over index ranges
export const FILTERS = {
  all: null,
  failed: ["job-failed", "job-offline"],
  completed: ["job-completed"],
  active: ["job-queued", "job-started"],
  revoked: ["job-revoked"],
};

const SOURCE = [
  "status",
  "workflow",
  "@timestamp",
  "short_error",
  "job.retry_count",
  "job.job_info.workflow_outputs",
];

const base = (runId, stepId) => [
  { term: { "workflow.run_id": runId } },
  { term: { "workflow.step_id": stepId } },
];

// `all`: the children with index in [start, end); a filter: the nth page of the matching docs
const queryPage = (runId, stepId, filter, page, start, end) => {
  const statuses = FILTERS[filter];
  if (!statuses) {
    return esSearch(JOB_STATUS_INDEX, {
      size: FETCH_CAP,
      query: {
        bool: {
          filter: [...base(runId, stepId), { range: { "workflow.child_index": { gte: start, lt: end } } }],
        },
      },
      sort: [{ "@timestamp": "asc" }],
      _source: SOURCE,
    });
  }
  return esSearch(JOB_STATUS_INDEX, {
    size: PAGE_SIZE,
    from: page * PAGE_SIZE,
    track_total_hits: true,
    query: { bool: { filter: [...base(runId, stepId), { terms: { status: statuses } }] } },
    sort: [{ "workflow.child_index": "asc" }, { "@timestamp": "desc" }],
    _source: SOURCE,
  });
};

/**
 * Children of a scattered step: progress against the threshold, then a paged table of
 * children (index, status, job link, output; `null` where a child failed). The run doc keeps
 * the child job ids only up to WORKFLOW_SCATTER_DOC_CHILDREN_MAX, so a large scatter is read
 * from the job_status index, one page at a time, never all at once.
 */
function ScatterChildren({ runId, stepId, progress, stepState, refreshKey }) {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [docs, setDocs] = useState(null);
  const [total, setTotal] = useState(null);
  const [error, setError] = useState(null);

  const n = progress.expected;
  const known = n !== null && n !== undefined;
  const filtered = filter !== "all";
  const idxTotal = known ? n : 0;
  const rowsTotal = filtered ? (total === null ? 0 : total) : idxTotal;
  const pg = childPage(rowsTotal, page, PAGE_SIZE, filtered ? null : progress.children);

  useEffect(() => {
    setPage(0);
    setDocs(null);
  }, [runId, stepId]);

  useEffect(() => {
    if (!known) return undefined;
    let cancelled = false;
    const start = page * PAGE_SIZE;
    queryPage(runId, stepId, filter, page, start, start + PAGE_SIZE)
      .then((data) => {
        if (cancelled) return;
        setError(null);
        if (filtered) {
          const t = data.hits.total;
          setTotal(t && typeof t === "object" ? t.value : t || 0);
          setDocs(data.hits.hits);
        } else {
          setDocs(data.hits.hits);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [runId, stepId, filter, page, known, refreshKey]);

  const changeFilter = (f) => {
    setFilter(f);
    setPage(0);
    setDocs(null);
    setTotal(null);
  };

  const t = thresholdResult(progress);
  const done = progress.completed;
  const failed = progress.failed;
  const bar = (v) => (n ? `${Math.min(100, (v / n) * 100)}%` : "0%");

  // rows: index ranges for `all` (children with no job yet show as not submitted), docs otherwise
  let rows = [];
  if (docs) {
    if (filtered) {
      const byIndex = pickChildDocs(docs, null);
      rows = Object.keys(byIndex)
        .map(Number)
        .sort((a, b) => a - b)
        .map((i) => ({ index: i, doc: byIndex[i] }));
    } else {
      const byIndex = pickChildDocs(docs, progress.children);
      rows = pg.rows.map((r) => ({ index: r.index, doc: byIndex[r.index] || null, jobId: r.jobId }));
    }
  }

  return (
    <div className="wf-sc">
      <div className="wf-sc-summary">
        <span className="wf-sc-count">
          {done}/{known ? n : "?"} completed
          {failed ? ` · ${failed} failed` : ""}
          {known && progress.active ? ` · ${progress.active} in flight` : ""}
        </span>
        <span className="wf-bar wf-sc-bar">
          <span className="wf-bar-done" style={{ width: bar(done) }} />
          <span className="wf-bar-failed" style={{ width: bar(failed) }} />
        </span>
      </div>
      {t ? (
        <div className={`wf-sc-threshold ${t.settled ? (t.passed ? "wf-sc-pass" : "wf-sc-fail") : ""}`}>
          threshold {pct(t.threshold)}: need {t.need} of {n} to complete,{" "}
          {t.settled
            ? t.passed
              ? `${done} did (${pct(t.ratio)}): passed`
              : `only ${done} did (${pct(t.ratio)}): the step fails with scatter_threshold`
            : t.lost
            ? "it can no longer be met"
            : `${Math.max(0, t.need - done)} more to go`}
          {stepState === "cancelled" ? " (step cancelled)" : ""}
        </div>
      ) : (
        <div className="wf-sc-threshold">
          threshold {pct(progress.threshold)}
          {progress.phase === "connector" ? ": the scatter connector is listing the items" : ": not fanned out yet"}
        </div>
      )}

      {known && n > 0 ? (
        <>
          <div className="wf-sc-toolbar">
            <span>
              filter:{" "}
              {Object.keys(FILTERS).map((f) => (
                <button
                  key={f}
                  className={`wf-sc-filter ${filter === f ? "wf-sc-filter-on" : ""}`}
                  onClick={() => changeFilter(f)}
                >
                  {f}
                </button>
              ))}
            </span>
            <span className="wf-sc-pager">
              <button disabled={page === 0} onClick={() => setPage(0)}>
                «
              </button>
              <button disabled={page === 0} onClick={() => setPage(page - 1)}>
                ‹
              </button>
              <span>
                {rowsTotal === 0 ? "0" : `${pg.start + 1}–${pg.end}`} of {rowsTotal.toLocaleString()}
                {pg.pages > 1 ? ` (page ${page + 1}/${pg.pages.toLocaleString()})` : ""}
              </span>
              <button disabled={page + 1 >= pg.pages} onClick={() => setPage(page + 1)}>
                ›
              </button>
              <button disabled={page + 1 >= pg.pages} onClick={() => setPage(pg.pages - 1)}>
                »
              </button>
            </span>
          </div>
          {error ? <div className="wf-sc-error">could not load children: {error}</div> : null}
          <table className="wf-sc-table">
            <thead>
              <tr>
                <th>#</th>
                <th>status</th>
                <th>job</th>
                <th>output</th>
              </tr>
            </thead>
            <tbody>
              {docs === null ? (
                <tr>
                  <td colSpan={4} className="wf-null">
                    loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="wf-null">
                    no children {filtered ? `with status ${filter}` : "on this page"}
                  </td>
                </tr>
              ) : (
                rows.map((r) => <ChildRow key={r.index} row={r} />)
              )}
            </tbody>
          </table>
        </>
      ) : null}
      {known && n === 0 ? <div className="wf-null">the item list was empty: the step completed with empty outputs</div> : null}
    </div>
  );
}

function ChildRow({ row }) {
  const { index, doc } = row;
  const src = (doc && doc._source) || {};
  const status = src.status;
  const jobId = doc ? doc._id : row.jobId;
  const retries = ((src.job || {}).retry_count || 0) | 0;
  const outs = jobOutputs(doc ? doc._source : null);
  const hasOut = Object.keys(outs).length > 0;
  return (
    <tr>
      <td>{index}</td>
      <td>
        {status ? <StatusBadge status={status} /> : <span className="wf-null">not submitted</span>}
        {retries ? <span className="wf-sc-retry"> retry {retries}</span> : null}
      </td>
      <td className="wf-sc-job">
        {jobId ? (
          <Link className="wf-link" to={jobUrl(jobId)} title="open this job in Figaro">
            {jobId}
          </Link>
        ) : (
          <span className="wf-null">-</span>
        )}
      </td>
      <td>
        {hasOut ? (
          <ValueView value={outs} />
        ) : status === "job-completed" ? (
          <span className="wf-null">(no outputs)</span>
        ) : status === "job-failed" || status === "job-offline" || status === "job-revoked" ? (
          <>
            <span className="wf-null">null</span>
            {src.short_error ? <span className="wf-sc-err"> {src.short_error}</span> : null}
          </>
        ) : (
          <span className="wf-null">-</span>
        )}
      </td>
    </tr>
  );
}

ScatterChildren.propTypes = {
  runId: PropTypes.string.isRequired,
  stepId: PropTypes.string.isRequired,
  progress: PropTypes.object.isRequired,
  stepState: PropTypes.string,
  refreshKey: PropTypes.any,
};

export default ScatterChildren;
