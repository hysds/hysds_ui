import React, { Fragment } from "react";
import PropTypes from "prop-types";

import { connect } from "react-redux";

import AceEditor from "react-ace";
import "brace/mode/json";
import "brace/theme/github";

const QueryEditor = props => {
  // redux action to change the on demand query
  const _handleQueryChange = val => props.editQuery(val);

  // disable submit job button
  const _validateESQuery = err => {
    const isValid = err.length > 0 ? false : true;
    props.validateQuery(isValid);
  };

  let { query } = props; // prop variables

  try {
    query = JSON.parse(query);
    query = JSON.stringify(query, null, 2);
  } catch (err) {}

  return (
    <Fragment>
      <AceEditor
        mode="json"
        theme="github"
        placeholder="Enter your Elasticsearch _search query"
        fontSize={12}
        showPrintMargin={false}
        showGutter={true}
        highlightActiveLine={true}
        setOptions={{
          showLineNumbers: true,
          tabSize: 2
        }}
        onChange={_handleQueryChange}
        value={query || ""}
        wrapEnabled={true}
        width="100%"
        maxLines={Infinity}
        onValidate={_validateESQuery}
        editorProps={{ $blockScrolling: Infinity }}
      />
    </Fragment>
  );
};

QueryEditor.propTypes = {
  editQuery: PropTypes.func.isRequired,
  validateQuery: PropTypes.func.isRequired
};

QueryEditor.defaultProps = {
  url: false
};

// Redux actions
const mapDispatchToProps = (dispatch, ownProps) => {
  const { url } = ownProps;
  const { editQuery, validateQuery } = ownProps; // actions
  return {
    editQuery: query => dispatch(editQuery(query, url)),
    validateQuery: validQuery => dispatch(validateQuery(validQuery))
  };
};

export default connect(null, mapDispatchToProps)(QueryEditor);
