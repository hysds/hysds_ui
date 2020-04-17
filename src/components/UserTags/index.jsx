import React, { Fragment } from "react";
import PropTypes from "prop-types";

import { Creatable } from "react-select";

class UserTags extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputValue: "",
      value: [],
    };
  }

  handleChange = (value, actionMeta) => {
    console.group("Value Changed");
    console.log(value);
    console.log(`action: ${actionMeta.action}`);
    console.groupEnd();
    this.setState({ value });
  };

  handleInputChange = (inputValue) => {
    this.setState({ inputValue });
  };

  handleKeyDown = (e) => {
    const { inputValue, value } = this.state;
    if (!inputValue) return;
    switch (e.key) {
      case "Enter":
      case "Tab":
        console.group("Value Added");
        console.log(value);
        console.groupEnd();
        this.setState({
          inputValue: "",
          value: [...value, this.createOption(inputValue)],
        });
        e.preventDefault();
    }
  };

  createOption = (label) => ({
    label,
    value: label,
  });

  render() {
    const components = {
      DropdownIndicator: null,
    };

    return (
      <Fragment>
        <Creatable
          components={components}
          inputValue={this.state.inputValue}
          isClearable
          isMulti
          menuIsOpen={false}
          onChange={this.handleChange}
          onInputChange={this.handleInputChange}
          onKeyDown={this.handleKeyDown}
          value={this.state.value}
          placeholder="User Tags..."
        />
      </Fragment>
    );
  }
}

export default UserTags;
