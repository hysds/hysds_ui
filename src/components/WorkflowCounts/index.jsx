import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useHistory } from "react-router-dom";

import { MOZART_ES_URL } from "../../config";
import { WORKFLOW_ES_INDEX, RUN_STATUSES } from "../../config/workflows";

import "../JobCountsBanner/style.css";
import "../WorkflowCommon/style.css";
import "./style.css";

const POLL_MS = 10000;

// Counts of runs by status, over the whole index (like the Jobs page's job counts), shown
// as chips. Clicking a chip filters the results by that status through the URL, which the
// status facet picks up.
function WorkflowCounts({ refreshKey }) {
  const history = useHistory();
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch(`${MOZART_ES_URL}/${WORKFLOW_ES_INDEX}/_search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          size: 0,
          track_total_hits: true,
          aggs: { status: { terms: { field: "status", size: 20 } } },
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (cancelled || !data.aggregations) return;
          const byStatus = {};
          data.aggregations.status.buckets.forEach((b) => {
            byStatus[b.key] = b.doc_count;
          });
          setCounts({ total: data.hits.total.value, ...byStatus });
        })
        .catch((err) => console.error("workflow counts failed:", err));
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [refreshKey]);

  const setStatus = (status) => {
    const params = new URLSearchParams(window.location.search);
    if (status && params.get("status") !== JSON.stringify(status))
      params.set("status", JSON.stringify(status));
    else params.delete("status");
    history.push({ search: `?${params.toString()}` });
  };

  const c = counts || {};
  return (
    <div className="figaro-job-count-banner wf-counts">
      <div className="figaro-job-count job-count total" onClick={() => setStatus(null)}>
        Total
        <br />
        <span className="figaro-job-count-value">{(c.total || 0).toLocaleString()}</span>
      </div>
      {RUN_STATUSES.map((s) => (
        <div
          key={s}
          className={`figaro-job-count wf-count wf-state-${s}`}
          onClick={() => setStatus(s)}
        >
          {s.charAt(0).toUpperCase() + s.slice(1)}
          <br />
          <span className="figaro-job-count-value">{(c[s] || 0).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

WorkflowCounts.propTypes = { refreshKey: PropTypes.any };

export default WorkflowCounts;
