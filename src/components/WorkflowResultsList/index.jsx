import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { ReactiveList } from "@appbaseio/reactivesearch";

import { dataSettled } from "../../redux/actions";
import { ensureSpec } from "../../redux/actions/workflows";

import ResultsBody from "../ResultsBody";
import { ButtonLink } from "../Buttons";
import { StatusBadge } from "../WorkflowCommon";
import WorkflowStepStrip from "../WorkflowStepStrip";
import {
  SortOptions,
  SortDirection,
  PageSizeOptions,
} from "../TableOptions";

import { RESULT_FIELDS } from "../../config/workflows";
import {
  runSpec,
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

// One compact card per run: header line, step strip, error line, buttons.
// The spec is fetched once per spec_id (redux caches it) to lay the strip out in order.
let WorkflowCard = ({ res, specEntry, ensureSpec }) => {
  useEffect(() => {
    ensureSpec(res.spec_id);
  }, [res.spec_id]);

  const { name, version } = runSpec(res);
  const user = runUser(res);
  const spec = specEntry && specEntry.status === "loaded" ? specEntry.spec : null;

  return (
    <div className="figaro-data-component wf-card">
      <div className="wf-card-head">
        <StatusBadge status={res.status} />
        <span className="wf-card-spec">
          {name}
          {version ? <span className="wf-card-version"> v{version}</span> : null}
        </span>
        <span className="wf-card-run">{res.run_id}</span>
        <span className="wf-card-buffer" />
        <span className="wf-card-meta" title="submitted (UTC)">
          {shortTime(res.submitted_at)}
        </span>
        <span className="wf-card-meta" title="duration">
          {formatDuration(runDurationSeconds(res))}
        </span>
        {user ? <span className="wf-card-meta">{user}</span> : null}
      </div>

      <WorkflowStepStrip run={res} spec={spec} compact />

      {res.error ? (
        <div className="wf-card-error">
          {res.failed_node ? `[${res.failed_node}] ` : ""}
          {res.error_class ? (
            <span title={errorClassLabel(res.error_class)}>({res.error_class}) </span>
          ) : null}
          {res.error}
        </div>
      ) : null}
      {res.halt_reason ? (
        <div className="wf-card-halt">ended early at halt: {res.halt_reason}</div>
      ) : null}

      <div className="wf-card-buttons">
        <ButtonLink
          label="Open run"
          size="small"
          href={`/workflows/run/${res.run_id}`}
        />
        <ButtonLink
          label="Jobs in Figaro"
          size="small"
          color="success"
          href={jobsUrl(res.run_id)}
        />
      </div>
    </div>
  );
};

WorkflowCard.propTypes = {
  res: PropTypes.object.isRequired,
  specEntry: PropTypes.object,
  ensureSpec: PropTypes.func.isRequired,
};

WorkflowCard = connect(
  (state, ownProps) => ({
    specEntry: state.workflowReducer.specs[ownProps.res.spec_id],
  }),
  (dispatch) => ({ ensureSpec: (id) => dispatch(ensureSpec(id)) })
)(WorkflowCard);

class WorkflowResultsList extends React.Component {
  constructor(props) {
    super(props);
    const pageSize = localStorage.getItem(PAGE_SIZE_STORE);
    this.state = {
      pageSize: pageSize ? parseInt(pageSize) : 10,
      sortColumn: localStorage.getItem(SORT_FIELD_STORE) || "submitted_at",
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
    const column = sortFields.includes(sortColumn) ? sortColumn : "submitted_at";

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
