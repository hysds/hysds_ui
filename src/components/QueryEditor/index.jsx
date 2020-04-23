import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import "./style.scss";

const QueryEditor = (props) => {
  let { query } = props;
  // TODO: use react hooks (useEffect) as componentDidMount to fix the weird type formatting

  try {
    query = JSON.parse(query);
    query = JSON.stringify(query, null, 2);
  } catch (err) {}

  const _handleQueryChange = (e) => props.editQuery(e.target.value);

  return (
    <div className="code-edit-container">
      <textarea
        spellCheck="false"
        className="code-input"
        value={query}
        onChange={_handleQueryChange}
      />
    </div>
  );
};

QueryEditor.propTypes = {
  editQuery: PropTypes.func.isRequired,
  validateQuery: PropTypes.func.isRequired,
};

QueryEditor.defaultProps = {
  url: false,
};

// Redux actions
const mapDispatchToProps = (dispatch, ownProps) => {
  const { url } = ownProps;
  const { editQuery, validateQuery } = ownProps; // actions
  return {
    editQuery: (query) => dispatch(editQuery(query, url)),
    validateQuery: (validQuery) => dispatch(validateQuery(validQuery)),
  };
};

export default connect(null, mapDispatchToProps)(QueryEditor);
