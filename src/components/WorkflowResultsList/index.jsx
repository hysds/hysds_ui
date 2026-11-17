import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { ReactiveList } from "@appbaseio/reactivesearch";

import { dataSettled } from "../../redux/actions";

import ResultsBody from "../ResultsBody";
import { ButtonLink } from "../Buttons";
import { StatusBadge } from "../WorkflowCommon";
import WorkflowStepStrip from "../WorkflowStepStrip";
import {
  SortOptions,
  SortDirection,
  PageSizeOptions,
} from "../TableOptions";

import { RESULT_FIELDS, DEFAULT_SORT } from "../../config/workflows";
import {
  runSpec,
  specKey,
  cwlUrl,
  haltedBy,
  runUser,
  runDurationSeconds,
  formatDuration,
  shortTime,
  jobsUrl,
  errorClassLabel,
} from "../../utils/workflow";

import "../FigaroResultsList/style.css";
import "./style.css";

const PAGE_SIZE_STORE = "page-size-workflows";
const SORT_FIELD_STORE = "sort-field-workflows";
const SORT_DIRECTION_STORE = "sort-direction-workflows";

// One compact card per run: header line, step strip, reason line, buttons. The run doc
// carries every step's state, so no spec has to be fetched to draw the strip.
const WorkflowCard = ({ res }) => {
  const { name, version } = runSpec(res);
  const user = runUser(res);
  const halted = haltedBy(res);
  const scattered = Object.values(res.steps || {}).filter((s) => s.scatter);
  const failedScatter = scattered.reduce((n, s) => n + ((s.scatter || {}).n_failed || 0), 0);

  return (
    <div className="figaro-data-component wf-card">
      <div className="wf-card-head">
        <StatusBadge status={res.status} />
        <Link className="wf-card-spec wf-link" to={cwlUrl(specKey(res))} title="CWL source and compiled spec">
          {name}
          {version ? <span className="wf-card-version"> v{version}</span> : null}
        </Link>
        <span className="wf-card-run">{res.run_id}</span>
        <span className="wf-card-buffer" />
        {res.on_error ? (
          <span className="wf-card-meta" title="on_error: what happens to the rest of the run when a step fails">
            on_error {res.on_error}
          </span>
        ) : null}
        <span className="wf-card-meta" title="created (UTC)">
          {shortTime(res.created_at)}
        </span>
        <span className="wf-card-meta" title="duration">
          {formatDuration(runDurationSeconds(res))}
        </span>
        {user ? <span className="wf-card-meta">{user}</span> : null}
      </div>

      <WorkflowStepStrip run={res} />

      {res.status === "halting" ? (
        <div className="wf-card-halting">halting: waiting for running jobs to finish ({res.on_error})</div>
      ) : null}
      {res.error_class || res.reason || res.failed_step ? (
        <div className="wf-card-error">
          {res.failed_step ? `[${res.failed_step}] ` : ""}
          {res.error_class ? <span title={errorClassLabel(res.error_class)}>({res.error_class}) </span> : null}
          {res.reason || ""}
        </div>
      ) : null}
      {halted ? (
        <div className="wf-card-halt">
          halt step {halted.step} fired (run {halted.status}){halted.reason ? `: ${halted.reason}` : ""}
        </div>
      ) : null}
      {failedScatter ? (
        <div className="wf-card-meta">{failedScatter} scatter child job(s) failed</div>
      ) : null}

      <div className="wf-card-buttons">
        <ButtonLink label="Open run" size="small" href={`/workflows/run/${res.run_id}`} />
        <ButtonLink label="Jobs in Figaro" size="small" color="success" href={jobsUrl(res.run_id)} />
      </div>
    </div>
  );
};

WorkflowCard.propTypes = {
  res: PropTypes.object.isRequired,
};

class WorkflowResultsList extends React.Component {
  constructor(props) {
    super(props);
    const pageSize = localStorage.getItem(PAGE_SIZE_STORE);
    this.state = {
      pageSize: pageSize ? parseInt(pageSize) : 10,
      sortColumn: localStorage.getItem(SORT_FIELD_STORE) || DEFAULT_SORT,
      sortOrder: localStorage.getItem(SORT_DIRECTION_STORE) || "desc",
    };
  }

  handlePageSize = (e) => {
    this.setState({ pageSize: parseInt(e.target.value) });
    localStorage.setItem(PAGE_SIZE_STORE, e.target.value);
  };

  handleSortColumn = (e) => {
    this.setState({ sortColumn: e.target.value });
    localStorage.setItem(SORT_FIELD_STORE, e.target.value);
  };

  handleSortDirection = (e) => {
    this.setState({ sortOrder: e.target.value });
    localStorage.setItem(SORT_DIRECTION_STORE, e.target.value);
  };

  renderItem = (res) => <WorkflowCard key={res._id} res={res} />;

  renderBody = (args) => (
    <ResultsBody
      {...args}
      tableView={false}
      renderTable={() => null}
      renderItem={this.renderItem}
      onSettled={this.props.dataSettled}
    />
  );

  render() {
    const { pageSize, sortColumn, sortOrder } = this.state;
    const { queryLogic, sortFields } = this.props;
    // a stored sort column may not exist in this index (e.g. duration_s before the backend writes it)
    const column = sortFields.includes(sortColumn) ? sortColumn : DEFAULT_SORT;

    return (
      <div>
        <div className="results-display-options">
          <div className="results-display-buffer" />
          <div className="sort-wrapper">
            <SortOptions
              label="Sort:"
              value={column}
              onChange={this.handleSortColumn}
              options={sortFields}
            />
            <SortDirection value={sortOrder} onChange={this.handleSortDirection} />
            <PageSizeOptions
              label="Page Size: "
              value={pageSize}
              onChange={this.handlePageSize}
            />
          </div>
        </div>

        <ReactiveList
          componentId="workflow-results"
          dataField="workflow-reactive-list"
          className="reactivesearch-results-list"
          pagination={true}
          size={pageSize}
          pages={7}
          sortOptions={[{ label: column, dataField: column, sortBy: sortOrder }]}
          paginationAt="both"
          react={queryLogic}
          render={this.renderBody}
          renderResultStats={(stats) => (
            <h3 className="figaro-result-stats">{`${stats.numberOfResults} runs`}</h3>
          )}
          includeFields={RESULT_FIELDS}
          onError={(e) => console.error("workflow results query failed:", e)}
        />
      </div>
    );
  }
}

WorkflowResultsList.propTypes = {
  queryLogic: PropTypes.object.isRequired,
  sortFields: PropTypes.array.isRequired,
  dataSettled: PropTypes.func.isRequired,
};

const mapDispatchToProps = (dispatch) => ({
  dataSettled: (t) => dispatch(dataSettled(t)),
});

export default connect(null, mapDispatchToProps)(WorkflowResultsList);
