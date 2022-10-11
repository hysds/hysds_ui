import React from "react";
import PropTypes from "prop-types";
import ReactTable from "react-table";

import "react-table/react-table.css";
import "./style.css";

function DataTable({ data, columns, sortColumn, sortOrder, sortHandler }) {
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
      defaultSorted={[
        {
          id: sortColumn.replace(".keyword", ""),
          desc: sortOrder === "desc" ? true : false,
        },
      ]}
    />
  );
}

DataTable.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
  sortOrder: PropTypes.string,
  sortHandler: PropTypes.string,
  sortHandler: PropTypes.func,
};

export default DataTable;
