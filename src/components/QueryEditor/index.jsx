import React, { Fragment } from "react";
import PropTypes from "prop-types";

import { connect } from "react-redux";

import AceEditor from "react-ace";
import "brace/mode/json";
import "brace/theme/github";

class OnDemandJsonEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  // redux action to change the on demand query
  _handleQueryChange = val => this.props.editOnDemandQuery(val);

  _validateESQuery = err => {
    // disable submit job button
    if (err.length > 0) console.log(err);
  };

  render() {
    let { query } = this.props; // prop variables

    try {
      query = JSON.parse(query);
      query = JSON.stringify(query, null, 2);
    } catch (err) {}

    return (
      <Fragment>
        <AceEditor
          mode="json"
          theme="github"
          fontSize={12}
          showPrintMargin={false}
          showGutter={true}
          highlightActiveLine={true}
          setOptions={{
            showLineNumbers: true,
            tabSize: 2
          }}
          onChange={this._handleQueryChange}
          value={query || ""}
          wrapEnabled={true}
          width="100%"
          maxLines={Infinity}
          onValidate={this._validateESQuery}
        />
      </Fragment>
    );
  }
}

OnDemandJsonEditor.propTypes = {
  editOnDemandQuery: PropTypes.func.isRequired
};

// Redux actions
const mapDispatchToProps = (dispatch, ownProps) => ({
  editOnDemandQuery: query => dispatch(ownProps.editOnDemandQuery(query))
});

export default connect(null, mapDispatchToProps)(OnDemandJsonEditor);
