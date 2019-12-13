import React, { Fragment } from "react";
import { connect } from "react-redux";
import ReactTable from "react-table";
import PropTypes from "prop-types";

import { TableToggle } from "../miscellaneous";

import "./style.css";

const UserRulesTable = props => {
  const columns = [
    {
      Header: "ID",
      accessor: "_id",
      show: false
    },
    {
      Header: "Name",
      accessor: "rule_name"
    },
    {
      Header: "Action",
      accessor: "workflow"
    },
    {
      Header: "Queue",
      accessor: "queue"
    },
    {
      Header: "Priority",
      accessor: "priority",
      width: 65
    },
    {
      Header: "User",
      accessor: "username",
      width: 150
    },
    {
      Header: "Enabled",
      accessor: "enabled",
      Cell: state => (
        <TableToggle
          checked={state.row.enabled}
          onChange={() =>
            props.toggleUserRule(state.row._id, !state.row.enabled)
          }
        />
      ),
      width: 100
    },
    {
      Header: "Created",
      accessor: "creation_time",
      width: 175
    },
    {
      Header: "Modified",
      accessor: "modified_time",
      width: 175
    }
  ];

  return (
    <ReactTable
      data={props.rules}
      columns={columns}
      showPagination={true}
      toggleUserRule={props.toggleUserRule}
    />
  );
};

UserRulesTable.propTypes = {
  rules: PropTypes.array.isRequired,
  toggleUserRule: PropTypes.func.isRequired
};

// redux state data
const mapStateToProps = state => ({
  userRules: state.toscaReducer.userRules
});

// Redux actions
const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    getUserRules: () => dispatch(getUserRules()),
    toggleUserRule: (ruleId, enabled) =>
      dispatch(ownProps.toggleUserRule(ruleId, enabled))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(UserRulesTable);
