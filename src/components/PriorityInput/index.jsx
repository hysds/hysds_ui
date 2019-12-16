import React, { Fragment } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import Select from "react-select";

import "./style.css";

/**
 * generate react-select array objects of queue list:
 * ex. [{value: 0, label: 0}, {value: 1, label: 1}]
 */
const generatePriorityList = n =>
  [...Array(n).keys()].slice(1).map(num => ({ value: num, label: num }));

const customSelectStyles = {
  control: (base, value) => ({
    ...base,
    border: value.hasValue ? null : "2px solid red",
    active: {
      border: null
    }
  })
};

const PriorityInput = props => {
  const { priority } = props;
  const priorityList = generatePriorityList(10);

  const _handleEditPriority = e => props.editJobPriority(e.value);

  return (
    <Fragment>
      <div className="priority-label">Priority:</div>
      <div className="priority-dropdown-wrapper">
        <Select
          label="Priority"
          name="priority"
          value={{
            label: "" || priority,
            value: "" || priority
          }}
          options={priorityList}
          onChange={_handleEditPriority}
          styles={customSelectStyles}
        />
      </div>
    </Fragment>
  );
};

PriorityInput.propTypes = {
  priority: PropTypes.number.isRequired,
  editJobPriority: PropTypes.func.isRequired
};

PriorityInput.defaultProps = {
  url: false
};

// Redux actions
const mapDispatchToProps = (dispatch, ownProps) => {
  const { editJobPriority, url } = ownProps;
  return {
    editJobPriority: query => dispatch(editJobPriority(query, url))
  };
};

export default connect(null, mapDispatchToProps)(PriorityInput);
