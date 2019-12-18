import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import ReactTable from "react-table";
import PropTypes from "prop-types";

import { TableToggle, Checkbox } from "../miscellaneous";
import { ToggleButton, DeleteButton } from "../../components/Buttons";

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
      accessor: "rule_name",
      width: 200
    },
    {
      Header: "Action",
      accessor: "job_type",
      width: 150
    },
    {
      Header: "Job Specification",
      accessor: "job_spec",
      show: false
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
      Header: "Enabled",
      accessor: "enabled",
      width: 100,
      Cell: state => (
        <ToggleButton
          loading={state.original.loading ? 1 : 0}
          enabled={state.row.enabled ? 1 : 0}
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
      Header: null,
      width: 100,
      Cell: state => (
        <DeleteButton
          onClick={() => console.log("clicked delete button!", state)}
        />
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

  const defaultSorted = [
    {
      id: "modified_time",
      desc: true
    }
  ];

  const _renderSubComponent = data => {
    let query, kwargs;
    try {
      query = JSON.parse(data.original.query_string);
      query = JSON.stringify(query, null, 2);
      kwargs = JSON.parse(data.original.kwargs);
      kwargs = JSON.stringify(kwargs, null, 2);
    } catch (err) {}

    return (
      <table className="user-rules-table-query-string">
        <tbody>
          <tr>
            <td>
              <pre>{query}</pre>
            </td>
            <td>
              <pre>{kwargs}</pre>
            </td>
          </tr>
        </tbody>
      </table>
    );
  };

  return (
    <ReactTable
      data={props.rules}
      columns={columns}
      showPagination={true}
      toggleUserRule={props.toggleUserRule}
      defaultSorted={defaultSorted}
      SubComponent={row => _renderSubComponent(row)}
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
