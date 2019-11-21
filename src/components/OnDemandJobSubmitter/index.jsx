import React, { Fragment } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import Select from "react-select";

/**
 * generate react-select array objects of queue list:
 * ex. [{value: 0, label: 0}, {value: 1, label: 1}]
 */
const generateQueueList = n =>
  [...Array(n).keys()].map(num => ({ value: num, label: num }));

class OnDemandJobSubmitter extends React.Component {
  constructor(props) {
    super(props);
    this.queueList = generateQueueList(10);
    this.state = {};
  }

  _handleEditPriority = e => {
    const priority = e.value;
    this.props.editOnDemandPriority(priority);
  };

  render() {
    return (
      <Fragment>
        <section>
          <div className="on-demand-dropdown-label">Queue:</div>
          <Select
            label="Select Queue"
            name="queue"
            options={this.queueList}
            // defaultValue={selectedQueue}
            // value={selectedQueue}
            onChange={this._handleEditPriority}
            // isDisabled={!queueList.length > 0}
            // style={selectStyles}
          />
        </section>
      </Fragment>
    );
  }
}

OnDemandJobSubmitter.propTypes = {
  editOnDemandPriority: PropTypes.func.isRequired
};

// Redux actions
const mapDispatchToProps = (dispatch, ownProps) => ({
  editOnDemandPriority: query => dispatch(ownProps.editOnDemandPriority(query))
});

export default connect(null, mapDispatchToProps)(OnDemandJobSubmitter);
