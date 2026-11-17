import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import { Link, useHistory } from "react-router-dom";
import ReactJson from "react-json-view";

import HeaderBar, {
  HeaderLink,
  DropdownSources,
} from "../../components/HeaderBar";
import { Button } from "../../components/Buttons";
import { Section, ValueView } from "../../components/WorkflowCommon";
import { workflowGet } from "../../redux/actions/workflows";
import {
  parseSpecId,
  mergeSteps,
  layoutGraph,
  shortTime,
  cwlUrl,
} from "../../utils/workflow";

import "../Figaro/style.css";
import "../WorkflowRun/style.css";
import "./style.css";

// download text as a file in the browser (no server round trip)
const download = (filename, text, type) => {
  const url = URL.createObjectURL(new Blob([text], { type: type || "text/plain" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const safeName = (s) => String(s).replace(/[^A-Za-z0-9._-]+/g, "_");

// the compiled spec's steps: deps, `when`, scatter, job type
function StepsTable({ spec }) {
  const merged = mergeSteps({ steps: {} }, spec);
  // layer = the earliest round in which a step can start
  const layer = {};
  layoutGraph(merged).nodes.forEach((n) => (layer[n.id] = n.layer));
  return (
    <table className="wfc-table">
      <thead>
        <tr>
          <th>step</th>
          <th>job type / halt</th>
          <th>depends on</th>
          <th>when</th>
          <th>scatter</th>
          <th>retries</th>
        </tr>
      </thead>
      <tbody>
        {merged.map((s) => {
          const sp = s.spec || {};
          return (
            <tr key={s.id}>
              <td>
                <b>{s.id}</b>
              </td>
              <td className="wfc-code">
                {s.kind === "halt"
                  ? `halt ${sp.halt.status}: ${sp.halt.reason || ""}`
                  : s.jobType || "-"}
              </td>
              <td>{s.deps.length ? s.deps.join(", ") : "-"}</td>
              <td className="wfc-code">{s.when || "-"}</td>
              <td className="wfc-code">
                {sp.scatter
                  ? `${sp.scatter.input}${
                      sp.scatter.threshold !== undefined ? `, threshold ${sp.scatter.threshold}` : ""
                    }${sp.scatter.connector ? `, ${sp.scatter.connector.job_type}` : ""}`
                  : "-"}
              </td>
              <td>{sp.max_retries ? `${sp.max_retries}` : "-"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function CwlDetail({ specId, darkMode }) {
  const [state, setState] = useState({ loading: true });
  const [tab, setTab] = useState("cwl");

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true });
    workflowGet(`/cwl/${encodeURIComponent(specId)}`)
      .then((r) => {
        if (cancelled) return;
        if (r.status === 404) setState({ error: `The workflow ${specId} is not registered.` });
        else if (!r.ok) setState({ error: r.body.message || `HTTP ${r.status}` });
        else setState({ doc: r.body.result });
      })
      .catch((err) => !cancelled && setState({ error: err.message }));
    return () => {
      cancelled = true;
    };
  }, [specId]);

  if (state.loading) return <div className="wfr-loading">Loading...</div>;
  if (state.error) return <div className="wfr-error">{state.error}</div>;

  const doc = state.doc;
  const spec = doc.spec || {};
  const { name } = parseSpecId(specId);
  const tabs = [
    ["cwl", "CWL source"],
    ["spec", "Compiled spec"],
    ["steps", "Steps"],
  ];
  if (doc.cwl_normalized) tabs.push(["normalized", "Normalized CWL"]);
  const jsonProps = {
    displayDataTypes: false,
    theme: darkMode ? "monokai" : "rjv-default",
    style: { backgroundColor: darkMode ? "var(--dark-theme-background)" : "var(--light-theme-background)" },
    displayObjectSize: false,
    collapsed: 3,
  };

  return (
    <div className="wfr-body">
      <div className="wfr-back">
        <Link className="wf-link" to="/workflows/cwl">
          ← registered workflows
        </Link>
      </div>
      <div className="wfr-header">
        <div className="wfr-title">
          <span className="wfr-run-id">{doc.id || name}</span>
          <span className="wfr-spec">v{doc.version}</span>
          {doc.label && doc.label !== doc.id ? <span className="wfr-label">{doc.label}</span> : null}
        </div>
        <div className="wfr-header-row">
          <span>schema {doc.schema_version || spec.schema_version || "?"}</span>
          {spec.on_error ? (
            <span>
              on_error <b>{spec.on_error}</b>
            </span>
          ) : null}
          <span>{Object.keys(spec.steps || {}).length} steps</span>
          {doc.username ? <span>registered by {doc.username}</span> : null}
          {doc.creation_time ? <span>on {shortTime(doc.creation_time)}</span> : null}
          <span className="wfc-sha" title="sha256 of the CWL text as registered">
            sha256 {doc.sha256 ? doc.sha256.slice(0, 16) : "?"}…
          </span>
          <span className="wfr-buffer" />
          <Link className="wf-link" to={`/workflows?spec=${encodeURIComponent(JSON.stringify(doc.id || name))}`}>
            runs of this workflow
          </Link>
          <Button
            label="Download CWL"
            size="small"
            disabled={!doc.cwl}
            onClick={() => download(`${safeName(doc.id)}-${safeName(doc.version)}.cwl`, doc.cwl)}
          />
        </div>
      </div>

      <div className="wfr-tabs">
        {tabs.map(([t, text]) => (
          <a key={t} className={`wfr-tab ${tab === t ? "wfr-tab-on" : ""}`} onClick={() => setTab(t)}>
            {text}
          </a>
        ))}
      </div>

      {tab === "cwl" ? (
        doc.cwl ? (
          <pre className="wfc-cwl">{doc.cwl}</pre>
        ) : (
          <div className="wfr-empty">No CWL text was stored for this workflow.</div>
        )
      ) : null}
      {tab === "spec" ? <ReactJson src={spec} {...jsonProps} /> : null}
      {tab === "steps" ? (
        <>
          <StepsTable spec={spec} />
          <Section title="Workflow inputs" count={Object.keys(spec.inputs || {}).length} defaultOpen>
            <ValueView value={spec.inputs || {}} />
          </Section>
          <Section title="Workflow outputs" count={Object.keys(spec.outputs || {}).length} defaultOpen>
            <ValueView value={spec.outputs || {}} />
          </Section>
        </>
      ) : null}
      {tab === "normalized" ? <ReactJson src={doc.cwl_normalized} {...jsonProps} /> : null}
    </div>
  );
}

function CwlList() {
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    workflowGet("/cwl")
      .then((r) => {
        if (!r.ok) setState({ error: r.body.message || `HTTP ${r.status}` });
        else setState({ items: r.body.result || [] });
      })
      .catch((err) => setState({ error: err.message }));
  }, []);
  if (state.loading) return <div className="wfr-loading">Loading...</div>;
  if (state.error) return <div className="wfr-error">{state.error}</div>;
  return (
    <div className="wfr-body">
      <div className="wfr-back">
        <Link className="wf-link" to="/workflows">
          ← workflow runs
        </Link>
      </div>
      <div className="wfr-title">
        <span className="wfr-run-id">Registered workflows</span>
        <span className="wfr-spec">{state.items.length}</span>
      </div>
      <table className="wfc-table">
        <thead>
          <tr>
            <th>workflow</th>
            <th>version</th>
            <th>label</th>
            <th>registered by</th>
            <th>registered</th>
          </tr>
        </thead>
        <tbody>
          {state.items.map((w) => (
            <tr key={w.spec_id}>
              <td>
                <Link className="wf-link" to={cwlUrl(w.spec_id)}>
                  {w.id}
                </Link>
              </td>
              <td>{w.version}</td>
              <td>{w.label}</td>
              <td>{w.username}</td>
              <td>{shortTime(w.creation_time)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WorkflowCwl({ match, darkMode }) {
  const specId = match.params.spec_id;
  const history = useHistory();
  const classTheme = darkMode ? "__theme-dark" : "__theme-light";
  return (
    <>
      <Helmet>
        <title>{specId ? `Workflow ${specId}` : "Registered workflows"}</title>
      </Helmet>
      <HeaderBar title="HySDS" theme={classTheme}>
        <HeaderLink href="/tosca" title="Tosca" active={0} />
        <HeaderLink href="/figaro" title="Figaro" active={0} />
        <HeaderLink href="/workflows" title="Workflows" active={1} />
        <DropdownSources />
      </HeaderBar>
      <div className={`${classTheme} wfr-page`}>
        {specId ? <CwlDetail specId={specId} darkMode={darkMode} /> : <CwlList history={history} />}
      </div>
    </>
  );
}

const mapStateToProps = (state) => ({ darkMode: state.themeReducer.darkMode });

export default connect(mapStateToProps)(WorkflowCwl);
