import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import ReactTable from "react-table";
import PropTypes from "prop-types";
import {
  ToggleButton,
  EditButton,
  DeleteButton
} from "../../components/Buttons";

import "./style.css";

const buttonCellStyle = {
  style: {
    paddingTop: 5,
    paddingBottom: 0
  }
};

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
      getProps: () => buttonCellStyle,
      Cell: state => (
        <ToggleButton
          loading={state.original.loading ? 1 : 0}
          enabled={state.row.enabled ? 1 : 0}
          onClick={() =>
            props.toggleUserRule(state.row._id, !state.row.enabled)
          }
        />
      )
    },
    {
      Header: null,
      width: 100,
      getProps: () => buttonCellStyle,
      Cell: state => (
        <Link to={`${props.link}/${state.row._id}`}>
          <EditButton />
        </Link>
      )
    },
    {
      Header: null,
      width: 100,
      getProps: () => buttonCellStyle,
      Cell: state => (
        <DeleteButton
          loading={state.original.loading ? 1 : 0}
          onClick={() => {
            var confirmDelete = confirm(`Delete rule? ${state.row.rule_name}`);
            if (confirmDelete) props.deleteUserRule(state.row._id);
          }}
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
  link: PropTypes.string.isRequired,
  rules: PropTypes.array.isRequired,
  toggleUserRule: PropTypes.func.isRequired,
  deleteUserRule: PropTypes.func.isRequired
};

// redux state data
const mapStateToProps = state => ({
  userRules: state.toscaReducer.userRules
});

// Redux actions
const mapDispatchToProps = (dispatch, ownProps) => {
  const { toggleUserRule, deleteUserRule } = ownProps;
  return {
    toggleUserRule: (ruleId, enabled) =>
      dispatch(toggleUserRule(ruleId, enabled)),
    deleteUserRule: id => dispatch(deleteUserRule(id))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(UserRulesTable);
