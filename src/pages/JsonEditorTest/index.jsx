import React from "react";
import { connect } from "react-redux";

import { JsonEditor as Editor } from "jsoneditor-react";
import ace from "brace";
import "brace/mode/json";
import "brace/theme/github";
import "brace/theme/twilight";
// import "jsoneditor-react/es/editor.min.css";

import "./style.scss";

class JsonEditorTest extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let query = this.props.query;
    try {
      query = JSON.parse(query);
    } catch (err) {
      console.log(err);
    }

    return (
      <div style={{ height: "100vh" }}>
        <Editor
          mode={Editor.modes.code}
          value={query}
          onChangeText={e => console.log(e)}
          onError={e => console.log(e)}
          ace={ace}
          // theme="ace/theme/github"
          theme="ace/theme/twilight"
        />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  query: state.generalReducer.query
});

export default connect(mapStateToProps)(JsonEditorTest);
