import React, { Fragment } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import Select from "react-select";

import "./style.css";

const customSelectStyles = {
  control: (base, value) => ({
    ...base,
    border: value.hasValue ? null : "2px solid red"
  })
};

const QueueInput = props => {
  const { queue, queueList } = props;

  const _handleQueueChange = e => props.changeQueue(e.value);

  return (
    <section className="queue-input-wrapper">
      <div className="queue-label">Queue:</div>
      <div className="queue-select-wrapper">
        <Select
          label="Queue"
          name="queue"
          options={queueList}
          value={{ label: queue, value: "" || queue }}
          onChange={_handleQueueChange}
          isDisabled={!(queueList.length > 0)}
          styles={customSelectStyles}
        />
      </div>
    </section>
  );
};

QueueInput.propTypes = {
  queueList: PropTypes.array.isRequired,
  changeQueue: PropTypes.func.isRequired
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const { changeQueue } = ownProps;
  return {
    changeQueue: queue => dispatch(changeQueue(queue))
  };
};

export default connect(null, mapDispatchToProps)(QueueInput);
