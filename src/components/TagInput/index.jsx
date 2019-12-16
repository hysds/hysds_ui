import React, { Fragment } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

import "./style.css";

const TagInput = props => {
  const { tags } = props;
  const _handleTagInput = e => props.editTags(e.target.value);

  return (
    <Fragment>
      <div className="tag-input-wrapper">
        <div className="tag-input-label">Tag:</div>
        <input
          type="text"
          placeholder="Required"
          name="tag"
          onChange={_handleTagInput}
          value={tags || ""}
          className="tag-input"
          required
        />
      </div>
    </Fragment>
  );
};

TagInput.propTypes = {
  editTags: PropTypes.func.isRequired
};

TagInput.defaultProps = {
  url: false
};

// Redux actions
const mapDispatchToProps = (dispatch, ownProps) => {
  const { url, editTags } = ownProps;
  return {
    editTags: tag => dispatch(editTags(tag, url))
  };
};

export default connect(null, mapDispatchToProps)(TagInput);
