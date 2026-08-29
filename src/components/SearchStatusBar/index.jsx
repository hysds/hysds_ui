import React from "react";
import PropTypes from "prop-types";

import SearchErrorBanner from "../SearchErrorBanner";

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
    this.state = { updatedAt: null, unchanged: false };
    this.searching = false;
    this.signatureBeforeSearch = null;
    this.settleTimer = null;
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
      }
      clearTimeout(this.settleTimer);
      return;
    }

    if (!loading && prevProps.loading && !error) {
      clearTimeout(this.settleTimer);
      this.settleTimer = setTimeout(() => {
        if (this.props.loading || this.props.error) return;
        const signature = this.signature();
        this.searching = false;
        this.setState({
          updatedAt: Date.now(),
          unchanged:
            this.signatureBeforeSearch !== null &&
            signature === this.signatureBeforeSearch,
        });
      }, SETTLE_MS);
    }
  }

  componentWillUnmount() {
    clearTimeout(this.settleTimer);
  }

  // The result *count* is not enough to tell two result sets apart: Elasticsearch caps
  // hits.total at 10,000 by default, so most queries here report the same number. Compare
  // the ids actually on screen instead.
  signature = () => {
    const { data, count } = this.props;
    return `${count}|${(data || []).map((d) => d._id).join(",")}`;
  };

  render() {
    const { loading, error, count } = this.props;
    const { updatedAt, unchanged } = this.state;

    if (loading)
      return (
        <div className="search-status search-status-searching">
          <span className="search-status-spinner" />
          Updating results&hellip; the results below are the previous ones.
        </div>
      );

    if (error) return <SearchErrorBanner error={error} staleSince={updatedAt} />;

    if (!updatedAt) return null;

    const time = new Date(updatedAt).toLocaleTimeString();
    const total = typeof count === "number" ? count.toLocaleString() : count;

    return (
      <div
        className={`search-status ${
          unchanged ? "search-status-unchanged" : "search-status-updated"
        }`}
      >
        {unchanged
          ? `No change - the same ${total} results match your filters (checked ${time}).`
          : `Updated ${time} - showing ${total} results for your current filters.`}
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
