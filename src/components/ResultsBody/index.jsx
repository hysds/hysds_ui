import React from "react";
import PropTypes from "prop-types";

import SearchStatusBar from "../SearchStatusBar";

/**
 * The body of a ReactiveList: the status bar, then the rows.
 *
 * Shared by Tosca and Figaro so the status-bar contract lives in one place. It is passed
 * to `render` rather than `renderItem` because `render` is the only prop reactivesearch
 * hands the live `loading` and `error` flags to, and the bar has to report the real
 * request state rather than infer it from what changed on screen.
 */
function ResultsBody({ data, loading, error, resultStats, tableView, renderTable, renderItem, onSettled }) {
  return (
    <>
      <SearchStatusBar
        loading={loading}
        error={error}
        count={resultStats && resultStats.numberOfResults}
        data={data}
        onSettled={onSettled}
      />
      <div className={loading ? "results-stale" : null}>
        {tableView ? renderTable({ data }) : data.map(renderItem)}
      </div>
    </>
  );
}

ResultsBody.propTypes = {
  data: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.any,
  resultStats: PropTypes.object,
  tableView: PropTypes.bool,
  renderTable: PropTypes.func.isRequired,
  renderItem: PropTypes.func.isRequired,
  onSettled: PropTypes.func,
};

export default ResultsBody;
