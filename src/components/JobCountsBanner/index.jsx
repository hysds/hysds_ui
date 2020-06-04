import React, { Fragment } from "react";
import { connect } from "react-redux";

import "./style.scss";

const JobCount = (props) => {
  const { title, count } = props;
  const cleanCount = count ? count.toLocaleString() : 0;

  return (
    <div className={`${props.className} figaro-job-count`}>
      {title || "Count"}:
      <br />
      <span className="figaro-job-count-value">{cleanCount}</span>
    </div>
  );
};

const JobCountsBanner = (props) => {
  const { dataCounts } = props;
  return (
    <Fragment>
      <div className="figaro-job-count-banner">
        <JobCount title="Total" count={dataCounts.total} />
        <JobCount
          title="Queued"
          count={dataCounts["job-queued"]}
          className="job-count-queued"
        />
        <JobCount
          title="Started"
          count={dataCounts["job-started"]}
          className="job-count-started"
        />
        <JobCount
          title="Completed"
          count={dataCounts["job-completed"]}
          className="job-count-completed"
        />
        <JobCount
          title="Failed"
          count={dataCounts["job-failed"]}
          className="job-count-failed"
        />
        <JobCount
          title="Revoked"
          count={dataCounts["job-revoked"]}
          className="job-count-revoked"
        />
        <JobCount
          title="Deduped"
          count={dataCounts["job-deduped"]}
          className="job-count-deduped"
        />
        <JobCount
          title="Offline"
          count={dataCounts["job-offline"]}
          className="job-count-offline"
        />
      </div>
    </Fragment>
  );
};

const mapStateToProps = (state) => ({
  dataCounts: state.generalReducer.jobCounts,
});

export default connect(mapStateToProps)(JobCountsBanner);
