import React, { useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import "./style.scss";

const QueryEditor = (props) => {
  let { query } = props;
  try {
    query = JSON.parse(query);
    query = JSON.stringify(query, null, 2);
  } catch (err) {}

  const [body, setBody] = useState(query);

  const _handleQueryChange = (e) => {
    setBody(e.target.value);
    props.editQuery(e.target.value);
  };

  return (
    <div className="code-edit-container">
      <textarea
        spellCheck="false"
        className="code-input"
        value={body}
        onChange={_handleQueryChange}
      />
    </div>
  );
};

QueryEditor.propTypes = {
  editQuery: PropTypes.func.isRequired,
};

QueryEditor.defaultProps = {
  url: false,
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const { url, editQuery } = ownProps;
  return {
    editQuery: (query) => dispatch(editQuery(query, url)),
  };
};

export default connect(null, mapDispatchToProps)(QueryEditor);
