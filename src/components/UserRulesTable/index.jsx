import React, { Fragment } from "react";
import { Link, Redirect } from "react-router-dom";
import { connect } from "react-redux";
import ReactTable from "react-table";
import PropTypes from "prop-types";

import { TableToggle, Checkbox } from "../miscellaneous";

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
      width: 100,
      Cell: state => (
        <Checkbox
          checked={state.row.enabled}
          onChange={() =>
            props.toggleUserRule(state.row._id, !state.row.enabled)
          }
        />
      )
    },
    {
      Header: null,
      width: 100,
      Cell: state => (
        <Link to={`${props.link}/${state.row._id}`}>
          <button type="button">Edit</button>
        </Link>
      )
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
      SubComponent={row => {
        let query;
        try {
          query = JSON.parse(row.original.query_string);
          query = JSON.stringify(query, null, 2);
          console.log(query);
        } catch (err) {}

        return (
          <div className="user-rules-table-query-string">
            <pre>{query}</pre>
          </div>
        );
      }}
    />
  );
};

UserRulesTable.propTypes = {
  rules: PropTypes.array.isRequired,
  toggleUserRule: PropTypes.func.isRequired,
  link: PropTypes.string.isRequired
};

// redux state data
const mapStateToProps = state => ({
  userRules: state.toscaReducer.userRules
});

// Redux actions
const mapDispatchToProps = (dispatch, ownProps) => ({
  getUserRules: () => dispatch(getUserRules()),
  toggleUserRule: (ruleId, enabled) =>
    dispatch(ownProps.toggleUserRule(ruleId, enabled)),
  tesEditToggle: (ruleId, enabled) =>
    dispatch(ownProps.tesEditToggle(ruleId, enabled))
});

export default connect(mapStateToProps, mapDispatchToProps)(UserRulesTable);
