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
import WorkflowGraph from "../../components/WorkflowGraph";
import ScatterChildren from "../../components/ScatterChildren";
import {
  StatusBadge,
  Section,
  ValueView,
  StateLegend,
} from "../../components/WorkflowCommon";

import {
  ensureSpec,
  esSearch,
  workflowPost,
  workflowGet,
} from "../../redux/actions/workflows";
import { JOB_STATUS_INDEX, AUTO_REFRESH_MS } from "../../config/workflows";
import {
  runSpec,
  specKey,
  cwlUrl,
  runUser,
  runStart,
  runDurationSeconds,
  spanSeconds,
  formatDuration,
  isLive,
  jobsUrl,
  jobUrl,
  defaultStep,
  mergeSteps,
  shortTime,
  haltedBy,
  stepReasons,
  mergedInputRows,
  scatterProgress,
  resolvedInputs,
  jobOutputs,
  cancelledByText,
  errorClassLabel,
  routeParam,
} from "../../utils/workflow";

import "../Figaro/style.css";
import "./style.css";

const MAX_ATTEMPT_DOCS = 50;

// job_status docs by id: the job doc of each attempt holds the step's resolved inputs
// (job.params) and outputs (job.job_info.workflow_outputs); the run doc keeps neither
const loadJobDocs = (ids) =>
  esSearch(JOB_STATUS_INDEX, {
    size: Math.min(ids.length, MAX_ATTEMPT_DOCS),
    query: { ids: { values: ids.slice(0, MAX_ATTEMPT_DOCS) } },
    _source: ["status", "short_error", "job.params", "job.job_info.workflow_outputs", "@timestamp"],
  }).then((data) => {
    const byId = {};
    data.hits.hits.forEach((h) => (byId[h._id] = h._source));
    return byId;
  });

const attemptIds = (rs) => {
  const ids = ((rs && rs.attempts) || []).map((a) => a.job_id).filter(Boolean);
  if (ids.length === 0 && rs && rs.job_id) ids.push(rs.job_id);
  return [...new Set(ids)];
};

function JobLink({ id }) {
  if (!id) return <span className="wf-null">-</span>;
  return (
    <Link className="wf-link wfr-jobid" to={jobUrl(id)} title="open this job in Figaro">
      {id}
    </Link>
  );
}

function Attempts({ attempts, docs }) {
  if (!attempts || attempts.length === 0) return null;
  return (
    <div className="wfr-attempts">
      <div className="wfr-subtitle">Attempts ({attempts.length})</div>
      <table className="wfr-table">
        <thead>
          <tr>
            <th>#</th>
            <th>status</th>
            <th>job</th>
            <th>started</th>
            <th>ended</th>
            <th>took</th>
            <th>error</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a, i) => {
            const full = (docs && docs[a.job_id] && docs[a.job_id].short_error) || null;
            return (
              <tr key={i}>
                <td>{a.attempt || i + 1}</td>
                <td>
                  <StatusBadge status={a.status} />
                </td>
                <td>
                  <JobLink id={a.job_id} />
                </td>
                <td>{shortTime(a.started_at)}</td>
                <td>{shortTime(a.ended_at)}</td>
                <td>{formatDuration(spanSeconds(a.started_at, a.ended_at))}</td>
                <td className="wfr-attempt-error">{a.error || full || ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// each input: what it resolved to (from the job doc) and what the compiled spec wires into it
function InputsTable({ rows, stepIds, onSelect }) {
  if (rows.length === 0) return <span className="wf-null">none</span>;
  return (
    <table className="wfr-table">
      <thead>
        <tr>
          <th>input</th>
          <th>value</th>
          <th>from</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name}>
            <td>
              <b>{r.name}</b>
            </td>
            <td>
              {r.value.kind === "value" ? (
                <ValueView value={r.value.value} />
              ) : (
                <span className="wf-null">{r.value.text}</span>
              )}
            </td>
            <td>
              {r.sources.length ? (
                <span className="wfr-code">
                  {r.sources.map((s, i) => (
                    <span key={i}>
                      {i ? ", " : ""}
                      {s.step && stepIds.includes(s.step) ? (
                        <>
                          {"$."}
                          <a className="wf-link" onClick={() => onSelect(s.step)}>
                            {s.step}
                          </a>
                          {s.text.slice(2 + s.step.length)}
                        </>
                      ) : (
                        s.text
                      )}
                    </span>
                  ))}
                </span>
              ) : (
                "-"
              )}
              {r.tags.length ? (
                <div className="wfr-tags">
                  {r.tags.map((t) => (
                    <span key={t} className="wfr-tag">
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function StepPanel({ run, step, docs, tick, onSelect }) {
  const rs = step.run || {};
  const sp = step.spec || {};
  const reasons = stepReasons(rs);
  const progress = scatterProgress(rs);
  const attempts = rs.attempts || [];
  const last = attempts.length ? attempts[attempts.length - 1] : null;
  const lastDoc = docs && last ? docs[last.job_id] : null;
  const jobDoc = lastDoc || (docs && rs.job_id ? docs[rs.job_id] : null);
  const inputs = jobDoc ? resolvedInputs(jobDoc) : null;
  const outputs = jobDoc ? jobOutputs(jobDoc) : null;
  const halt = rs.halt || sp.halt;
  const dur = spanSeconds(rs.started_at, rs.ended_at);

  return (
    <div className="wfr-panel figaro-data-component">
      <div className="wfr-panel-head">
        <b>Step {step.id}</b>
        <StatusBadge status={step.state} />
        <span className="wfr-kind">{step.kind === "halt" ? "halt step" : step.scatter ? "job step, scattered" : "job step"}</span>
        {step.jobType ? <span className="wfr-kind wfr-code">{step.jobType}</span> : null}
        {sp.queue ? <span className="wfr-kind">queue {sp.queue}</span> : null}
        {sp.max_retries ? <span className="wfr-kind">max_retries {sp.max_retries}</span> : null}
        <span className="wfr-buffer" />
        <Link className="wf-link" to={jobsUrl(run.run_id, step.id)}>
          jobs in Figaro
        </Link>
      </div>

      {step.when ? (
        <div className="wfr-step-line">
          <span className="wf-when-tag">when</span> <code>{step.when}</code>
          {rs.skipped_by ? (
            <b> was {JSON.stringify(rs.skipped_by.value)}: skipped</b>
          ) : step.state === "pending" ? (
            " (evaluated once its dependencies have settled)"
          ) : (
            " was true"
          )}
        </div>
      ) : null}
      {step.deps.length ? (
        <div className="wfr-step-line">
          depends on{" "}
          {step.deps.map((d, i) => (
            <span key={d}>
              {i ? ", " : ""}
              <a className="wf-link" onClick={() => onSelect(d)}>
                {d}
              </a>
            </span>
          ))}
        </div>
      ) : null}
      <div className="wfr-step-line wfr-times">
        {rs.started_at ? `started ${shortTime(rs.started_at)}` : "not started"}
        {rs.ended_at ? ` · ended ${shortTime(rs.ended_at)}` : ""}
        {dur !== null && rs.started_at ? ` · ${formatDuration(dur)}` : ""}
      </div>

      {reasons.map((r, i) => (
        <div key={i} className={`wfr-reason wfr-reason-${r.kind}`}>
          {r.text}
        </div>
      ))}
      {halt && !rs.halt ? (
        <div className="wfr-reason wfr-reason-halt">
          halt (run {halt.status}): {halt.reason || "no reason given"}
        </div>
      ) : null}

      {progress ? (
        <>
          <div className="wfr-subtitle">
            Scatter over <code>{progress.input}</code>
          </div>
          <ScatterChildren
            runId={run.run_id}
            stepId={step.id}
            progress={progress}
            stepState={step.state}
            refreshKey={tick}
          />
        </>
      ) : null}

      <Attempts attempts={attempts} docs={docs} />

      {step.kind === "job" ? (
        <>
          <div className="wfr-subtitle">Inputs</div>
          <InputsTable
            rows={mergedInputRows(sp, {
              inputs,
              state: step.state,
              hasAttempt: !!(last || rs.job_id),
              docsLoaded: !!docs,
              scatterInput: progress ? progress.input || "" : null,
            })}
            stepIds={run.steps ? Object.keys(run.steps) : []}
            onSelect={onSelect}
          />
          {!progress ? (
            <>
              <div className="wfr-subtitle">Outputs</div>
              {outputs && Object.keys(outputs).length ? (
                <ValueView value={outputs} />
              ) : (
                <span className="wf-null">
                  {step.state === "completed" ? "(none)" : "none yet: only a completed job writes outputs"}
                </span>
              )}
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function WorkflowRun({ match, darkMode, specs, ensureSpec }) {
  const runId = routeParam(match.params.run_id);
  const history = useHistory();
  const classTheme = darkMode ? "__theme-dark" : "__theme-light";

  const [run, setRun] = useState(null);
  const [source, setSource] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [docs, setDocs] = useState(null);
  const [tick, setTick] = useState(0);
  const [tab, setTab] = useState("steps");
  const [modal, setModal] = useState(null); // "rerun" | "cancel"
  const [acting, setActing] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  const key = run ? specKey(run) : null;
  const specEntry = key ? specs[key] : null;
  const registered = specEntry && specEntry.status === "loaded" ? specEntry.spec : null;
  const spec = registered ? registered.spec : null;
  const merged = run ? mergeSteps(run, spec) : [];
  const step = merged.find((s) => s.id === selected) || null;

  const loadRun = useCallback(
    () =>
      workflowGet(`/runs/${encodeURIComponent(runId)}`)
        .then((r) => {
          if (r.status === 404) throw new Error(`Run ${runId} was not found`);
          if (!r.ok) throw new Error(r.body.message || `HTTP ${r.status}`);
          setRun(r.body.result);
          setSource(r.body.source || null);
          setError(null);
        })
        .catch((err) => {
          console.error(err);
          setError(err.message);
        }),
    [runId]
  );

  useEffect(() => {
    setRun(null);
    setSelected(null);
    setDocs(null);
    loadRun();
  }, [runId]);

  useEffect(() => {
    if (key) ensureSpec(key);
  }, [key]);

  // choose the first step to show once the run and the spec fetch have settled
  useEffect(() => {
    if (run && selected === null && specEntry && specEntry.status !== "loading")
      setSelected(defaultStep(run, merged));
  }, [run, specEntry]);

  // the selected step's job docs (resolved inputs / outputs); re-read on every poll
  const stepRun = step && step.run;
  const ids = stepRun ? attemptIds(stepRun) : [];
  const idsKey = ids.join(",");
  useEffect(() => {
    setDocs(null);
  }, [selected]);
  useEffect(() => {
    if (!idsKey) {
      setDocs({});
      return undefined;
    }
    let cancelled = false;
    loadJobDocs(idsKey.split(","))
      .then((d) => !cancelled && setDocs(d))
      .catch((err) => {
        console.error("job docs failed:", err);
        if (!cancelled) setDocs({});
      });
    return () => {
      cancelled = true;
    };
  }, [selected, idsKey, stepRun && stepRun.state, tick]);

  // auto-refresh while the run can still change (running, or halting for a drain)
  const status = run && run.status;
  const refreshRef = useRef();
  refreshRef.current = () => {
    loadRun();
    setTick((t) => t + 1);
  };
  useEffect(() => {
    if (!isLive(status)) return undefined;
    const timer = setInterval(() => refreshRef.current(), AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [status]);

  const fail = (what) => (err) => {
    setActing(false);
    setModal(null);
    setActionMsg(`${what} failed: ${err.message}`);
  };

  const doRerun = () => {
    setActing(true);
    const body = { spec_id: specKey(run), inputs: run.inputs || {} };
    if (run.tags && run.tags.length) body.tags = run.tags;
    workflowPost("/runs", body)
      .then((r) => {
        setActing(false);
        setModal(null);
        const newId = r.body.run_id || r.body.result;
        if (r.ok && newId) history.push(`/workflows/run/${newId}`);
        else setActionMsg(`Rerun failed: ${r.body.message || `HTTP ${r.status}`}`);
      })
      .catch(fail("Rerun"));
  };

  // POST /workflow/runs/<id>/cancel: 202 = requested (the engine cancels and revokes jobs),
  // 200 = already cancelled, 404 / 409 = unknown run / already completed or failed
  const doCancel = () => {
    setActing(true);
    workflowPost(`/runs/${encodeURIComponent(runId)}/cancel`, {})
      .then((r) => {
        setActing(false);
        setModal(null);
        if (r.ok) {
          setActionMsg(
            r.status === 202
              ? "Cancel requested. The engine cancels the run and revokes its jobs; this page updates as it does."
              : r.body.message || "Run is already cancelled."
          );
          loadRun();
          setTick((t) => t + 1);
        } else setActionMsg(`Cancel failed: ${r.body.message || `HTTP ${r.status}`}`);
      })
      .catch(fail("Cancel"));
  };

  const goBack = () => (history.length > 1 ? history.goBack() : history.push("/workflows"));

  let content;
  if (error && !run) {
    content = <div className="wfr-error">{error}</div>;
  } else if (!run) {
    content = <div className="wfr-loading">Loading...</div>;
  } else {
    const { name, version } = runSpec(run);
    const halted = haltedBy(run);
    const canCancel = isLive(run.status);
    const label = registered && registered.label;
    const noSpec = specEntry && specEntry.status === "failed";
    const frozen = run.job_definitions ? Object.keys(run.job_definitions) : [];

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
              <Link className="wf-link" to={cwlUrl(key)} title="CWL source and compiled spec">
                {name}
                {version ? ` v${version}` : ""}
              </Link>
            </span>
            {label && label !== name ? <span className="wfr-label">{label}</span> : null}
          </div>
          <div className="wfr-header-row">
            <StatusBadge status={run.status} />
            <span title="what happens to the rest of the run when a step fails">
              on_error <b>{run.on_error || "kill"}</b>
            </span>
            <span>created {shortTime(run.created_at)}</span>
            {runStart(run) !== run.created_at ? <span>started {shortTime(runStart(run))}</span> : null}
            {run.ended_at ? <span>ended {shortTime(run.ended_at)}</span> : null}
            <span>duration {formatDuration(runDurationSeconds(run))}</span>
            {runUser(run) ? <span>user {runUser(run)}</span> : null}
            {run.tags && run.tags.length ? <span>tags {run.tags.join(", ")}</span> : null}
            <span className="wfr-buffer" />
            {isLive(status) ? <span className="wfr-auto">auto-refresh {AUTO_REFRESH_MS / 1000}s</span> : null}
            {source ? (
              <span className="wfr-auto" title="live runs are read from Redis, finished ones from OpenSearch">
                from {source}
              </span>
            ) : null}
            <ButtonLink label="Jobs in Figaro" size="small" color="success" href={jobsUrl(run.run_id)} />
            <ButtonLink label="CWL" size="small" href={cwlUrl(key)} />
            <Button label="Rerun" size="small" onClick={() => setModal("rerun")} />
            <Button
              label="Cancel run"
              size="small"
              color="fail"
              disabled={!canCancel}
              title={canCancel ? "" : `run is ${run.status}`}
              onClick={() => setModal("cancel")}
            />
          </div>
          {run.status === "halting" ? (
            <div className="wfr-halting">
              Halting: a step failed or a halt step fired and on_error is <b>{run.on_error}</b>. Queued jobs
              were revoked; the run ends when the jobs that are still running finish.
            </div>
          ) : null}
          {run.error_class || run.reason || run.failed_step ? (
            <div className="wfr-run-error">
              {run.failed_step ? (
                <>
                  [
                  <a className="wf-link" onClick={() => setSelected(run.failed_step)}>
                    {run.failed_step}
                  </a>
                  ]{" "}
                </>
              ) : null}
              {run.error_class ? <span title={errorClassLabel(run.error_class)}>({run.error_class}) </span> : null}
              {run.reason || ""}
            </div>
          ) : null}
          {halted ? (
            <div className="wfr-halt-reason">
              Halt step{" "}
              <a className="wf-link" onClick={() => setSelected(halted.step)}>
                {halted.step}
              </a>{" "}
              fired: the run ends {halted.status}
              {halted.reason ? `: ${halted.reason}` : ""}
            </div>
          ) : null}
          {run.cancelled_by ? <div className="wfr-step-line">cancelled by {cancelledByText(run.cancelled_by)}</div> : null}
          {actionMsg ? <div className="wfr-action-msg">{actionMsg}</div> : null}
          {noSpec ? (
            <div className="wfr-action-msg">
              {specEntry.notFound
                ? `The workflow ${key} is not registered on this server, so the dependency graph is not available. Steps are listed from the run document.`
                : `Could not load the workflow ${key}: ${specEntry.message || "error"}. Steps are listed from the run document.`}
            </div>
          ) : null}
        </div>

        <div className="wfr-tabs">
          {[
            ["steps", "Steps"],
            ["json", "JSON"],
          ].map(([t, text]) => (
            <a key={t} className={`wfr-tab ${tab === t ? "wfr-tab-on" : ""}`} onClick={() => setTab(t)}>
              {text}
            </a>
          ))}
        </div>

        {tab === "json" ? (
          <ReactJson
            src={run}
            displayDataTypes={false}
            theme={darkMode ? "monokai" : "rjv-default"}
            style={{
              backgroundColor: darkMode ? "var(--dark-theme-background)" : "var(--light-theme-background)",
            }}
            displayObjectSize={false}
            collapsed={2}
          />
        ) : (
          <>
            <WorkflowGraph run={run} merged={merged} selected={selected} onSelect={setSelected} />
            <StateLegend />

            {step ? <StepPanel run={run} step={step} docs={docs} tick={tick} onSelect={setSelected} /> : null}

            <Section title="Run inputs" count={Object.keys(run.inputs || {}).length} defaultOpen>
              <ValueView value={run.inputs || {}} />
            </Section>
            <Section title="Run outputs" count={run.outputs ? Object.keys(run.outputs).length : 0} defaultOpen={!!run.outputs}>
              {run.outputs ? (
                <ValueView value={run.outputs} />
              ) : (
                <span className="wf-null">{isLive(run.status) ? "none yet: written when the run completes" : "none"}</span>
              )}
            </Section>
            {frozen.length ? (
              <Section title="Frozen job definitions" count={frozen.length}>
                <ValueView value={run.job_definitions} />
              </Section>
            ) : null}
          </>
        )}

        <ConfirmationModal
          isOpen={modal === "rerun"}
          onClose={() => setModal(null)}
          onConfirm={doRerun}
          title="Rerun workflow"
          message={`Start a NEW run of ${key} with the same inputs as ${run.run_id}? This run is not changed.`}
          confirmText="Rerun"
          loading={acting}
        />
        <ConfirmationModal
          isOpen={modal === "cancel"}
          onClose={() => setModal(null)}
          onConfirm={doCancel}
          title="Cancel workflow run"
          message={`Cancel ${run.run_id}? Its queued and running jobs are revoked and the steps that have not started are cancelled. This cannot be undone.`}
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
