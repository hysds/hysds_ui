import React, { Fragment } from "react";
// import "font-awesome/css/font-awesome.min.css";

import "./style.scss";

export const ToggleSlider = props => (
  <div className="table-toggle-wrapper">
    <span className="table-toggle-label">{props.label || "Label: "} </span>
    <label className="switch">
      <input type="checkbox" {...props} />
      <span className="slider round"></span>
    </label>
  </div>
);

export const SortOptions = props => (
  <div className="sort-results-select-wrapper">
    <span>{props.label || "Label: "} </span>
    <select
      className="sort-column-dropdown"
      {...props}
      // value={sortColumn}
      // onChange={this._handleSortColumnChange}
    >
      <option value="None">None</option>
      {props.options.map(field => (
        <option key={`sort-column-${field}`} value={field}>
          {field}
        </option>
      ))}
    </select>
  </div>
);

SortOptions.defaultProps = {
  options: []
};

export const SortDirection = props => (
  <div className="sort-direction-select-wrapper">
    <select className="sort-order-dropdown" {...props}>
      <option key="sort-direction-desc" value="desc">
        desc
      </option>
      <option key="sort-direction-asc" value="asc">
        asc
      </option>
    </select>
  </div>
);

export const PageSizeOptions = props => (
  <div className="results-page-select-wrapper">
    <span>{props.label || "Page Size:"} </span>
    <select className="page-size-dropdown" {...props}>
      {props.options.map(x => (
        <option key={`page-size-dropdown-${x}`} value={x}>
          {x}
        </option>
      ))}
    </select>
  </div>
);

PageSizeOptions.defaultProps = {
  options: [10, 25, 50, 100]
};
