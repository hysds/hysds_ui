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
 *   unchanged  - the query succeeded and the rows on screen are the same ones as before
 *   updated    - the query succeeded and the results below match the filters shown
 *
 * It reports what the query engine did, so it cannot speak for an interaction that never
 * reached the engine: when reactivesearch legitimately skips a query as a duplicate of one
 * already run, no loading transition occurs and the previous verdict simply stands. That
 * is accurate -- the rows really do match the current filters -- but it is not a state
 * this component detects.
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
    this.lastReportedSignature = null;
    this.settleTimer = null;
    this.tickTimer = null;
    this.startedAt = null;
    this.finishedAt = null;
  }

  componentDidUpdate(prevProps) {
    const { loading, error } = this.props;

    if (loading && !prevProps.loading) this.beginLeg();

    // An error ends the interaction wherever it lands. It can arrive without a falling
    // edge at all -- a superseded batch rejecting after this one already finished -- and
    // leaving the flag set would mis-anchor the next interaction's start time and verdict.
    if (error && !prevProps.error) {
      this.endInteraction(false);
      return;
    }

    if (!loading && prevProps.loading) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
      this.noteArrival(!error);
      return;
    }

    // A concurrent interaction can deliver rows with no loading edge of its own: while one
    // request is in flight a second setLoading(true) is a no-op, so its response arrives
    // with `loading` already false. Watch the data itself so those still settle.
    if (
      this.startedAt !== null && // a search has run at least once; ignore mount noise
      !loading &&
      !error &&
      this.signature() !== this.lastReportedSignature
    ) {
      this.noteArrival(true);
    }
  }

  // Results arrived. The signature is recorded HERE, not just when the interaction is
  // finally reported: `onSettled` dispatches, which re-renders, which re-enters
  // componentDidUpdate -- so leaving the marker stale until the settle callback 500ms
  // later meant the data-watch branch re-fired on every one of those renders and React
  // aborted with "maximum update depth exceeded".
  noteArrival = (publish) => {
    this.finishedAt = Date.now();
    this.lastReportedSignature = this.signature();
    // Published at arrival rather than from the settle timer, which a route change can
    // cancel before it ever fires.
    if (publish && this.props.onSettled) this.props.onSettled(this.finishedAt);
    this.scheduleSettle();
  };

  // A single click fires several queries (the results list plus each facet aggregation),
  // so an interaction spans several legs. Only the first anchors the comparison and the
  // clock; every leg re-arms the ticker.
  beginLeg = () => {
    if (!this.searching) {
      this.searching = true;
      this.signatureBeforeSearch = this.signature();
      this.startedAt = Date.now();
      this.setState({ elapsedMs: 0, durationMs: null });
    }
    clearTimeout(this.settleTimer);
    clearInterval(this.tickTimer);
    this.tickTimer = setInterval(
      () => this.setState({ elapsedMs: Date.now() - this.startedAt }),
      1000
    );
  };

  scheduleSettle = () => {
    clearTimeout(this.settleTimer);
    this.settleTimer = setTimeout(() => {
      if (this.props.loading) return; // another leg started; it will settle
      this.endInteraction(!this.props.error);
    }, SETTLE_MS);
  };

  endInteraction = (report) => {
    clearTimeout(this.settleTimer);
    clearInterval(this.tickTimer);
    this.tickTimer = null;
    this.searching = false;
    if (!report) return;

    const signature = this.signature();
    this.lastReportedSignature = signature;
    this.setState({
      updatedAt: this.finishedAt || Date.now(),
      durationMs:
        this.startedAt && this.finishedAt ? this.finishedAt - this.startedAt : null,
      unchanged:
        this.signatureBeforeSearch !== null &&
        signature === this.signatureBeforeSearch,
    });
  };

  componentWillUnmount() {
    clearTimeout(this.settleTimer);
    clearInterval(this.tickTimer);
  }

  formatDuration = (ms) => {
    if (ms === null || ms === undefined) return null;
    if (ms < 1000) return `${ms}ms`;
    // Round to whole seconds FIRST, then split: rounding the remainder independently of
    // the minutes produced "1m 60s", and toFixed on 59,980ms produced "60.0s".
    const secs = Math.round(ms / 1000);
    if (secs < 60) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  };

  // The result *count* is not enough to tell two result sets apart: Elasticsearch caps
  // hits.total at 10,000 by default, so most queries here report the same number. Compare
  // the ids actually on screen instead.
  signature = () => {
    const { data, count } = this.props;
    return `${count}|${(data || []).map((d) => d._id).join(",")}`;
  };

  render() {
    const { loading, error } = this.props;
    const { updatedAt, unchanged, durationMs, elapsedMs } = this.state;

    // A retry in flight outranks the error it is retrying: `error` is not cleared until
    // the retry answers, so testing it first left "your filter change was NOT applied"
    // standing over the entire flight of a change that was being applied.
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

    // Settling: the rows on screen are already the new ones (updateHits lands before
    // setLoading(false)), so this must not repeat the "previous ones" claim.
    if (this.searching)
      return (
        <div className="search-status search-status-searching">
          <span className="search-status-spinner" />
          Updating results&hellip;
        </div>
      );

    if (!updatedAt) return null;

    const time = formatUtc(updatedAt, true);
    const took = this.formatDuration(durationMs);

    return (
      <div
        className={`search-status ${
          unchanged ? "search-status-unchanged" : "search-status-updated"
        }`}
      >
        {unchanged
          ? `No change - the results on screen are the same as before (checked ${time}).`
          : `Updated ${time} - these results match your current filters.`}
        {took ? <span className="search-status-timing"> Took {took}.</span> : null}
      </div>
    );
  }
}

SearchStatusBar.propTypes = {
  onSettled: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.any,
  count: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  data: PropTypes.array,
};

export default SearchStatusBar;
