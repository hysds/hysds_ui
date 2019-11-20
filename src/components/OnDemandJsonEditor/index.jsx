import React, { Fragment } from "react";
import AceEditor from "react-ace";

import "brace/mode/json";
import "brace/theme/github";

class OnDemandForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  /**
   * TODO:
   *    handle changing of the query (action passed as prop)
   *    validate ES query (probably put it in the handling of the query)
   */

  render() {
    const { query } = this.props;

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
          // onChange={this._handleQueryChange}
          value={query || ""}
          wrapEnabled={true}
          width="100%"
          maxLines={Infinity}
          // onValidate={this._validateESQuery}
        />
      </Fragment>
    );
  }
}

export default OnDemandForm;
