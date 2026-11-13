import React, { useState, useEffect, useCallback, useRef } from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { Link, useHistory } from "react-router-dom";
import ReactJson from "react-json-view";

import HeaderBar, {
  HeaderLink,
  DropdownSources,
} from "../../components/HeaderBar";
import { Button, ButtonLink } from "../../components/Buttons";
import ConfirmationModal from "../../components/ConfirmationModal";
import { FigaroDataViewer } from "../../components/FigaroDataViewer";
import WorkflowStepStrip, {
  stepsFor,
} from "../../components/WorkflowStepStrip";
import ScatterGrid from "../../components/ScatterGrid";
import { StatusBadge, Section, ValueView } from "../../components/WorkflowCommon";

import {
  ensureSpec,
  esSearch,
  workflowPost,
} from "../../redux/actions/workflows";
import { FIELDS } from "../../config/figaro";
import {
  WORKFLOW_REST_API,
  JOB_STATUS_INDEX,
  AUTO_REFRESH_MS,
} from "../../config/workflows";
import {
  runSpec,
  runUser,
  runDurationSeconds,
  formatDuration,
  isTerminal,
  jobsUrl,
  defaultStep,
  summarizeStatuses,
  shortTime,
} from "../../utils/workflow";

import "../Figaro/style.css";
import "../../components/FigaroDataViewer/style.css";
import "./style.css";

const MAX_GRID = 10000;

// job counts per step, from the job_status index: {step: {total, completed, failed, byStatus}}
const loadStepCounts = (runId) =>
  esSearch(JOB_STATUS_INDEX, {
    size: 0,
    query: { term: { "workflow.run_id": runId } },
    aggs: {
      steps: {
        terms: { field: "workflow.step_id", size: 500 },
        aggs: { st: { terms: { field: "status", size: 20 } } },
      },
    },
  }).then((data) => {
    const out = {};
    data.aggregations.steps.buckets.forEach((b) => {
      const byStatus = {};
      b.st.buckets.forEach((s) => (byStatus[s.key] = s.doc_count));
      out[b.key] = { ...summarizeStatuses(byStatus), byStatus };
    });
    return out;
  });

// one doc per child_index of a scatter step (retries overwrite the same doc)
const loadGrid = (runId, stepId, size) =>
  esSearch(JOB_STATUS_INDEX, {
    size: Math.min(Math.max(size, 1), MAX_GRID),
    query: {
      bool: {
        filter: [
          { term: { "workflow.run_id": runId } },
          { term: { "workflow.step_id": stepId } },
        ],
      },
    },
    _source: ["workflow.child_index", "status", "job.retry_count"],
  }).then((data) => {
    const cells = {};
    data.hits.hits.forEach((h) => {
      const w = h._source.workflow || {};
      if (w.child_index === null || w.child_index === undefined) return;
      cells[w.child_index] = {
        status: h._source.status,
        retries: ((h._source.job || {}).retry_count || 0) | 0,
        id: h._id,
      };
    });
    return cells;
  });

const loadStepJobs = (runId, stepId, childIndex) => {
  const filter = [
    { term: { "workflow.run_id": runId } },
    { term: { "workflow.step_id": stepId } },
  ];
  if (childIndex !== null && childIndex !== undefined)
    filter.push({ term: { "workflow.child_index": childIndex } });
  return esSearch(JOB_STATUS_INDEX, {
    size: 20,
    query: { bool: { filter } },
    sort: [{ "@timestamp": "desc" }],
    _source: FIELDS.filter((f) => f !== "_index" && f !== "_id"),
  }).then((data) =>
    data.hits.hits.map((h) => ({ _index: h._index, _id: h._id, ...h._source }))
  );
};

function Attempts({ attempts }) {
  if (!attempts || attempts.length === 0) return null;
  return (
    <div className="wfr-attempts">
      <div className="wfr-subtitle">Attempts ({attempts.length})</div>
      {attempts.map((a, i) => (
        <div key={i} className="wfr-attempt">
          #{i + 1} {a.status || ""} {a.error_class ? `[${a.error_class}] ` : ""}
          {a.error || ""} {a.job_id ? ` (${a.job_id})` : ""}
        </div>
      ))}
    </div>
  );
}

function WorkflowRun({ match, darkMode, specs, ensureSpec }) {
  const runId = match.params.run_id;
  const history = useHistory();
  const classTheme = darkMode ? "__theme-dark" : "__theme-light";

  const [run, setRun] = useState(null);
  const [error, setError] = useState(null);
  const [stepCounts, setStepCounts] = useState({});
  const [cells, setCells] = useState({});
  const [selectedStep, setSelectedStep] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [gridFilter, setGridFilter] = useState("all");
  const [jobs, setJobs] = useState(null);
  const [tab, setTab] = useState("details");
  const [modal, setModal] = useState(null); // "rerun" | "cancel"
  const [acting, setActing] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  const specEntry = run ? specs[run.spec_id] : null;
  const spec = specEntry && specEntry.status === "loaded" ? specEntry.spec : null;
  const steps = run ? stepsFor(run, spec) : [];
  const stepIds = steps.map((s) => s.id);
  const sel = steps.find((s) => s.id === selectedStep);
  const childStep = sel && sel.isChild;

  // refs so the polling closure always sees the latest selection
  const selRef = useRef({});
  selRef.current = { selectedStep, selectedChild, childStep, run };

  const loadRun = useCallback(
    () =>
      fetch(`${WORKFLOW_REST_API}/runs/${encodeURIComponent(runId)}`)
        .then((res) => {
          if (res.status === 404) throw new Error(`Run ${runId} was not found`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          setRun(data.result);
          setError(null);
          return data.result;
        })
        .catch((err) => {
          console.error(err);
          setError(err.message);
        }),
    [runId]
  );

  const loadLive = useCallback(() => {
    loadStepCounts(runId)
      .then(setStepCounts)
      .catch((err) => console.error("step counts failed:", err));
    const { selectedStep: step, childStep: isChild, run: r } = selRef.current;
    if (step && isChild) {
      const node = ((r || {}).nodes || {})[step] || {};
      loadGrid(runId, step, node.expected || 1000)
        .then(setCells)
        .catch((err) => console.error("grid failed:", err));
    }
  }, [runId]);

  const refresh = useCallback(() => {
    loadRun();
    loadLive();
    const { selectedStep: step, selectedChild: child, childStep: isChild } = selRef.current;
    if (step && (!isChild || child !== null)) {
      loadStepJobs(runId, step, isChild ? child : null)
        .then(setJobs)
        .catch((err) => console.error("step jobs failed:", err));
    }
  }, [runId, loadRun, loadLive]);

  // initial load
  useEffect(() => {
    setRun(null);
    setSelectedStep(null);
    setSelectedChild(null);
    setCells({});
    setJobs(null);
    loadRun();
  }, [runId]);

  useEffect(() => {
    if (run) ensureSpec(run.spec_id);
  }, [run && run.spec_id]);

  // choose the first step to show once both the run and its spec are known
  useEffect(() => {
    if (run && selectedStep === null && (spec || (specEntry && specEntry.status === "failed")))
      setSelectedStep(defaultStep(run, steps));
  }, [run, spec, specEntry]);

  // step counts + grid + step jobs when the selection changes
  useEffect(() => {
    if (!run) return;
    setJobs(null);
    setSelectedChild(null);
    setCells({});
    loadLive();
  }, [runId, selectedStep, !!run]);

  // for a scatter step, pick the first failed child (else child 0) once the grid is in
  useEffect(() => {
    if (!childStep || selectedChild !== null) return;
    const idx = Object.keys(cells).map(Number).sort((a, b) => a - b);
    if (idx.length === 0) return;
    const failed = idx.find((i) => cells[i].status === "job-failed");
    setSelectedChild(failed !== undefined ? failed : idx[0]);
  }, [cells, childStep, selectedChild]);

  useEffect(() => {
    if (!selectedStep || !run) return;
    if (childStep && selectedChild === null) return;
    loadStepJobs(runId, selectedStep, childStep ? selectedChild : null)
      .then(setJobs)
      .catch((err) => console.error("step jobs failed:", err));
  }, [selectedStep, selectedChild, childStep, !!run]);

  // auto-refresh only while running
  const status = run && run.status;
  useEffect(() => {
    if (status !== "running") return undefined;
    const timer = setInterval(refresh, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [status, refresh]);

  const doRerun = () => {
    setActing(true);
    const body = { spec_id: run.spec_id, inputs: run.inputs || {} };
    if (run.tags && run.tags.length) body.tags = run.tags;
    workflowPost("/runs", body)
      .then((r) => {
        setActing(false);
        setModal(null);
        const newId = r.body.run_id || r.body.result;
        if (r.ok && newId) history.push(`/workflows/run/${newId}`);
        else setActionMsg(`Rerun failed: ${r.body.message || `HTTP ${r.status}`}`);
      })
      .catch((err) => {
        setActing(false);
        setModal(null);
        setActionMsg(`Rerun failed: ${err.message}`);
      });
  };

  const doCancel = () => {
    setActing(true);
    workflowPost(`/runs/${encodeURIComponent(runId)}/cancel`, {})
      .then((r) => {
        setActing(false);
        setModal(null);
        if (r.ok) {
          setActionMsg(
            `Run cancelled${
              r.body.revoked !== undefined ? ` (${r.body.revoked} jobs revoked)` : ""
            }.`
          );
          refresh();
        } else setActionMsg(`Cancel failed: ${r.body.message || `HTTP ${r.status}`}`);
      })
      .catch((err) => {
        setActing(false);
        setModal(null);
        setActionMsg(`Cancel failed: ${err.message}`);
      });
  };

  const goBack = () => (history.length > 1 ? history.goBack() : history.push("/workflows"));

  let content;
  if (error && !run) {
    content = <div className="wfr-error">{error}</div>;
  } else if (!run) {
    content = <div className="wfr-loading">Loading...</div>;
  } else {
    const { name, version } = runSpec(run);
    const nodes = run.nodes || {};
    const node = selectedStep ? nodes[selectedStep] || {} : null;
    const counts = selectedStep ? stepCounts[selectedStep] : null;
    const stepOutputs = Object.keys(nodes).filter(
      (k) => nodes[k].outputs && Object.keys(nodes[k].outputs).length > 0
    );
    const extra = Object.keys(stepCounts).filter((id) => !stepIds.includes(id));
    // live counts per step for the chain bar: the job_status aggregation beats the run doc
    const live = {};
    steps.forEach((s) => {
      const c = stepCounts[s.id];
      if (s.isChild && c)
        live[s.id] = {
          total: Math.max((nodes[s.id] || {}).expected || 0, c.total),
          completed: c.completed,
          failed: c.failed,
        };
    });
    const gridTotal = childStep
      ? Math.max(node.expected || 0, (counts && counts.total) || 0)
      : 0;
    const specLabel = spec && spec.label;
    const canCancel = run.status === "running";

    content = (
      <div className="wfr-body">
        <div className="wfr-back">
          <a className="wf-link" onClick={goBack}>
            ← back to results
          </a>
        </div>

        <div className="wfr-header">
          <div className="wfr-title">
            <span className="wfr-run-id">{run.run_id}</span>
            <span className="wfr-spec">
              {name}
              {version ? ` v${version}` : ""}
            </span>
            {specLabel ? <span className="wfr-label">{specLabel}</span> : null}
          </div>
          <div className="wfr-header-row">
            <StatusBadge status={run.status} />
            <span>submitted {shortTime(run.submitted_at)}</span>
            {run.ended_at ? <span>ended {shortTime(run.ended_at)}</span> : null}
            <span>duration {formatDuration(runDurationSeconds(run))}</span>
            {runUser(run) ? <span>user {runUser(run)}</span> : null}
            {run.tags && run.tags.length ? <span>tags {run.tags.join(", ")}</span> : null}
            {run.current_nodes && run.current_nodes.length ? (
              <span>current {run.current_nodes.join(", ")}</span>
            ) : null}
            <span className="wfr-buffer" />
            {status === "running" ? (
              <span className="wfr-auto">auto-refresh {AUTO_REFRESH_MS / 1000}s</span>
            ) : null}
            <ButtonLink
              label="Jobs in Figaro"
              size="small"
              color="success"
              href={jobsUrl(run.run_id)}
            />
            <Button label="Rerun" size="small" onClick={() => setModal("rerun")} />
            <Button
              label="Cancel"
              size="small"
              color="fail"
              disabled={!canCancel}
              title={canCancel ? "" : `run is ${run.status}`}
              onClick={() => setModal("cancel")}
            />
          </div>
          {run.error ? (
            <div className="wfr-run-error">
              {run.failed_node ? `[${run.failed_node}] ` : ""}
              {run.error_class ? `(${run.error_class}) ` : ""}
              {run.error}
            </div>
          ) : null}
          {actionMsg ? <div className="wfr-action-msg">{actionMsg}</div> : null}
        </div>

        <div className="wfr-tabs">
          {["details", "json"].map((t) => (
            <a
              key={t}
              className={`wfr-tab ${tab === t ? "wfr-tab-on" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "json" ? "JSON" : "Steps"}
            </a>
          ))}
        </div>

        {tab === "json" ? (
          <ReactJson
            src={run}
            displayDataTypes={false}
            theme={darkMode ? "monokai" : "rjv-default"}
            style={{
              backgroundColor: darkMode
                ? "var(--dark-theme-background)"
                : "var(--light-theme-background)",
            }}
            displayObjectSize={false}
            collapsed={2}
          />
        ) : (
          <>
            <WorkflowStepStrip
              run={run}
              spec={spec}
              live={live}
              selected={selectedStep}
              onSelect={setSelectedStep}
              extra={extra}
            />

            {selectedStep ? (
              <div className="wfr-panel figaro-data-component">
                <div className="wfr-panel-head">
                  <b>Step {selectedStep}</b>
                  {sel ? <span className="wfr-kind">{sel.kind}{sel.isChild ? " (scatter child)" : ""}</span> : null}
                  {sel && sel.node && sel.node.run ? <span className="wfr-kind">{sel.node.run}</span> : null}
                  {node && node.state ? <StatusBadge status={node.state} /> : null}
                  {sel && sel.node && sel.node.completion ? (
                    <span className="wfr-kind">threshold {sel.node.completion.threshold}</span>
                  ) : null}
                  <span className="wfr-buffer" />
                  <Link className="wf-link" to={jobsUrl(runId, selectedStep)}>
                    open in Figaro
                  </Link>
                </div>
                {node && (node.started_at || node.ended_at || node.completed_at) ? (
                  <div className="wfr-step-times">
                    {node.started_at ? `started ${shortTime(node.started_at)} ` : ""}
                    {node.ended_at || node.completed_at
                      ? `ended ${shortTime(node.ended_at || node.completed_at)}`
                      : ""}
                  </div>
                ) : null}
                {node && node.error ? <div className="wfr-run-error">{node.error}</div> : null}
                <Attempts attempts={node && node.attempts} />

                {childStep ? (
                  <ScatterGrid
                    cells={cells}
                    total={gridTotal}
                    filter={gridFilter}
                    onFilter={setGridFilter}
                    selected={selectedChild}
                    onSelect={setSelectedChild}
                  />
                ) : counts ? (
                  <div className="wfr-step-times">
                    {counts.total} job{counts.total === 1 ? "" : "s"}: {counts.completed} completed, {counts.failed} failed
                  </div>
                ) : null}

                {childStep && selectedChild !== null ? (
                  <div className="wfr-subtitle">Child #{selectedChild}</div>
                ) : null}
                {jobs === null && (!childStep || selectedChild !== null) ? (
                  <div className="wfr-loading">Loading jobs...</div>
                ) : null}
                {jobs && jobs.length === 0 ? (
                  <div className="wfr-empty">No job submitted for this step yet.</div>
                ) : null}
                {jobs
                  ? jobs.map((job) => (
                      <FigaroDataViewer
                        key={`${job._index}-${job._id}`}
                        res={job}
                        editCustomFilterId={(id, value) =>
                          history.push(`/figaro?${id}=${encodeURIComponent(JSON.stringify(value))}`)
                        }
                      />
                    ))
                  : null}
              </div>
            ) : null}

            <Section title="Inputs" count={Object.keys(run.inputs || {}).length} defaultOpen>
              <ValueView value={run.inputs || {}} />
            </Section>
            <Section title="Outputs" count={run.outputs ? Object.keys(run.outputs).length : 0}>
              {run.outputs ? <ValueView value={run.outputs} /> : <span className="wf-null">none yet</span>}
            </Section>
            <Section title="Step outputs" count={stepOutputs.length}>
              {stepOutputs.length === 0 ? (
                <span className="wf-null">none</span>
              ) : (
                stepOutputs.map((k) => (
                  <div key={k}>
                    <div className="wfr-subtitle">{k}</div>
                    <ValueView value={nodes[k].outputs} />
                  </div>
                ))
              )}
            </Section>
          </>
        )}

        <ConfirmationModal
          isOpen={modal === "rerun"}
          onClose={() => setModal(null)}
          onConfirm={doRerun}
          title="Rerun workflow"
          message={`Start a NEW run of ${run.spec_id} with the same inputs as ${run.run_id}? This run is not changed.`}
          confirmText="Rerun"
          loading={acting}
        />
        <ConfirmationModal
          isOpen={modal === "cancel"}
          onClose={() => setModal(null)}
          onConfirm={doCancel}
          title="Cancel workflow run"
          message={`Cancel ${run.run_id} and revoke its queued and running jobs? This cannot be undone.`}
          confirmText="Cancel run"
          confirmColor="fail"
          cancelText="Keep running"
          loading={acting}
        />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Workflow run {runId}</title>
      </Helmet>
      <HeaderBar title="HySDS" theme={classTheme}>
        <HeaderLink href="/tosca" title="Tosca" active={0} />
        <HeaderLink href="/figaro" title="Figaro" active={0} />
        <HeaderLink href="/workflows" title="Workflows" active={1} />
        <DropdownSources />
      </HeaderBar>
      <div className={`${classTheme} wfr-page`}>{content}</div>
    </>
  );
}

const mapStateToProps = (state) => ({
  darkMode: state.themeReducer.darkMode,
  specs: state.workflowReducer.specs,
});

export default connect(mapStateToProps, (dispatch) => ({
  ensureSpec: (id) => dispatch(ensureSpec(id)),
}))(WorkflowRun);
