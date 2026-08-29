import React from "react";
import PropTypes from "prop-types";

import SearchErrorBanner from "../SearchErrorBanner";

import { formatUtc } from "../../utils";

import "./style.css";

/**
 * Says, in words, what state the results panel is in after every interaction.
 *
 * Operators previously had to infer this: a result set that visibly changed meant the
 * click worked, one that looked the same meant... something. It could equally be a
 * correct no-op (the filter genuinely matches the same documents), a query that was never
 * sent, or a search that failed silently. Those are very different situations and they
 * looked identical, so this bar names the one you are actually in:
 *
 *   searching  - a query is in flight; the results below are the PREVIOUS ones
 *   failed     - the query failed; the results below are stale and do not match the filters
 *   unchanged  - the query succeeded and returned exactly the same documents as before
 *   updated    - the query succeeded and the results below match the filters shown
 *
 * `loading` and `error` come straight from reactivesearch's own store (via ReactiveList's
 * render prop), so this reflects the real request state rather than a guess.
 */
// A single user action (clicking a facet) fires several queries in quick succession --
// the results list and each facet's own aggregation -- so `loading` flips true/false more
// than once per interaction. Settling before reporting coalesces that burst into the one
// outcome the user actually cares about.
const SETTLE_MS = 500;

class SearchStatusBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = { updatedAt: null, unchanged: false, durationMs: null, elapsedMs: 0 };
    this.searching = false;
    this.signatureBeforeSearch = null;
    this.settleTimer = null;
    this.tickTimer = null;
    this.startedAt = null;
    this.finishedAt = null;
  }

  componentDidUpdate(prevProps) {
    const { loading, error } = this.props;

    if (loading && !prevProps.loading) {
      // A search started. Remember what was on screen BEFORE it, so that when the dust
      // settles we compare against the view the user was looking at when they clicked --
      // not against some intermediate response from the same interaction.
      if (!this.searching) {
        this.searching = true;
        this.signatureBeforeSearch = this.signature();
        this.startedAt = Date.now();
        // Queries can take anything from tens of milliseconds to tens of seconds
        // depending on how much of the index is already cached, so count up while we
        // wait: a slow search should look slow, not hung.
        this.setState({ elapsedMs: 0, durationMs: null });
        clearInterval(this.tickTimer);
        this.tickTimer = setInterval(
          () => this.setState({ elapsedMs: Date.now() - this.startedAt }),
          1000
        );
      }
      clearTimeout(this.settleTimer);
      return;
    }

    if (!loading && prevProps.loading) {
      this.finishedAt = Date.now();
      clearInterval(this.tickTimer);

      // A failed search ends the interaction -- the error banner stands until the user
      // tries again. Without releasing the flag here it stays set (the settle callback
      // below, which normally clears it, is only scheduled on success), so the next
      // search would never re-anchor: it would keep the failed search's start time and
      // report a duration spanning the failure and however long the user waited before
      // retrying, and would not restart the elapsed counter.
      if (error) this.searching = false;
    }

    if (!loading && prevProps.loading && !error) {
      clearTimeout(this.settleTimer);
      this.settleTimer = setTimeout(() => {
        if (this.props.loading || this.props.error) return;
        const signature = this.signature();
        this.searching = false;
        this.setState({
          updatedAt: Date.now(),
          // the settle delay is ours, so report the time the queries actually took
          durationMs:
            this.startedAt && this.finishedAt ? this.finishedAt - this.startedAt : null,
          unchanged:
            this.signatureBeforeSearch !== null &&
            signature === this.signatureBeforeSearch,
        });
      }, SETTLE_MS);
    }
  }

  componentWillUnmount() {
    clearTimeout(this.settleTimer);
    clearInterval(this.tickTimer);
  }

  formatDuration = (ms) => {
    if (ms === null || ms === undefined) return null;
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const m = Math.floor(ms / 60000);
    return `${m}m ${Math.round((ms % 60000) / 1000)}s`;
  };

  // The result *count* is not enough to tell two result sets apart: Elasticsearch caps
  // hits.total at 10,000 by default, so most queries here report the same number. Compare
  // the ids actually on screen instead.
  signature = () => {
    const { data, count } = this.props;
    return `${count}|${(data || []).map((d) => d._id).join(",")}`;
  };

  render() {
    const { loading, error, count } = this.props;
    const { updatedAt, unchanged, durationMs, elapsedMs } = this.state;

    if (loading)
      return (
        <div className="search-status search-status-searching">
          <span className="search-status-spinner" />
          Updating results&hellip; the results below are the previous ones.
          {elapsedMs >= 1000 ? (
            <span className="search-status-timing">
              {" "}
              {this.formatDuration(elapsedMs)} so far
            </span>
          ) : null}
        </div>
      );

    if (error) return <SearchErrorBanner error={error} staleSince={updatedAt} />;

    if (!updatedAt) return null;

    const time = formatUtc(updatedAt, true);
    const total = typeof count === "number" ? count.toLocaleString() : count;
    const took = this.formatDuration(durationMs);

    return (
      <div
        className={`search-status ${
          unchanged ? "search-status-unchanged" : "search-status-updated"
        }`}
      >
        {unchanged
          ? `No change - the same ${total} results match your filters (checked ${time}).`
          : `Updated ${time} - showing ${total} results for your current filters.`}
        {took ? <span className="search-status-timing"> Took {took}.</span> : null}
      </div>
    );
  }
}

SearchStatusBar.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.any,
  count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  data: PropTypes.array,
};

export default SearchStatusBar;
