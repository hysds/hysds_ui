import React, { Fragment } from "react";
import PropTypes from "prop-types";

import { SingleList, DateRange, MultiList } from "@appbaseio/reactivesearch";

import "./style.scss";

const renderFilter = filter => {
  const { componentId, dataField, title, type } = filter;
  switch (type) {
    case "single":
      return (
        <SingleList
          componentId={componentId}
          key={componentId}
          dataField={dataField}
          title={title}
          URLParams={true}
          className="reactivesearch-input"
        />
      );
    case "multi":
      return (
        <MultiList
          componentId={componentId}
          key={componentId}
          dataField={dataField}
          title={title}
          URLParams={true}
          className="reactivesearch-input reactivesearch-multilist"
        />
      );
    case "date":
      return (
        <DateRange
          componentId={componentId}
          key={componentId}
          title={title}
          dataField={dataField}
          URLParams={true}
          className="reactivesearch-input reactivesearch-date"
        />
      );
    default:
      return (
        <SingleList
          componentId={componentId}
          key={componentId}
          dataField={dataField}
          title={title}
          URLParams={true}
          className="reactivesearch-input"
        />
      );
  }
};

const FigaroFilters = ({ filters }) => (
  <Fragment>{filters.map(filter => renderFilter(filter))}</Fragment>
);

FigaroFilters.propTypes = {
  filters: PropTypes.array.isRequired
};

FigaroFilters.defaultProps = {
  filters: []
};

export default FigaroFilters;
