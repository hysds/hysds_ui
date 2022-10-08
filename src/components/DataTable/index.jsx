import React from "react";
import PropTypes from "prop-types";
import ReactTable from "react-table";

import "react-table/react-table.css";
import "./style.css";

function DataTable({ data, columns, sortHandler }) {
  return (
    <ReactTable
      manual
      data={data}
      columns={columns}
      showPagination={false}
      showPageSizeOptions={false}
      pageSize={data.length}
      sortable={sortHandler ? true : false}
      onSortedChange={(sorted, column) => {
        const col = sorted[0];
        const direction = col.desc ? "desc" : "asc";
        const sortKey = column.keyword ? `${col.id}.keyword` : col.id;
        if (sortHandler) sortHandler(sortKey, direction);
      }}
    />
  );
}

DataTable.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
  sortHandler: PropTypes.func,
};

export default DataTable;
