import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import ReactTable from "react-table";

import { getUserRules } from "../../redux/actions";

const columns = [
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

const UserRulesViewer = class extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.getUserRules();
  }

  render() {
    const { userRules } = this.props;

    return (
      <div>
        <ReactTable
          manual
          data={userRules}
          columns={columns}
          showPagination={true}
          showPageSizeOptions={true}
          // pageSize={0}
          sortable={false}
        />
      </div>
    );
  }
};

// redux state data
const mapStateToProps = state => ({
  userRules: state.toscaReducer.userRules
});

// Redux actions
const mapDispatchToProps = dispatch => {
  return {
    getUserRules: () => dispatch(getUserRules())
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(UserRulesViewer);
