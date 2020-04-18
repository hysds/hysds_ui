import React, { useState } from "react";
import PropTypes from "prop-types";
import { Creatable } from "react-select";

const UserTags = (props) => {
  const { userTags, endpoint, index, id } = props;

  const [value, setValue] = useState(userTags);
  const [input, setInputValue] = useState("");

  const handleRemove = (value, removed) => {
    const removedValue = removed.removedValue.value;
    const params = new URLSearchParams({ id, index, tag: removedValue });
    const url = `${endpoint}?${params}`;
    fetch(url, { method: "DELETE" }).then(() => setValue(value));
  };
  const handleInputChange = (val) => setInputValue(val);
  const handleKeyDown = (e) => {
    switch (e.key) {
      case "Enter":
      case "Tab":
        const inputTrim = input.trim();
        const idx = value.findIndex((val) => inputTrim === val.value); // checking for dupes
        if (idx === -1 && inputTrim !== "") {
          const data = { index, id, tag: inputTrim };
          fetch(endpoint, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }).then(() =>
            setValue([...value, { label: inputTrim, value: inputTrim }])
          );
        }
        setInputValue("");
        e.preventDefault();
    }
  };

  return (
    <Creatable
      components={{ DropdownIndicator: null }}
      inputValue={input}
      isClearable
      isMulti
      menuIsOpen={false}
      onChange={handleRemove}
      onInputChange={handleInputChange}
      onKeyDown={handleKeyDown}
      value={value}
      placeholder="User Tags..."
    />
  );
};

UserTags.propTypes = {
  userTags: PropTypes.string.isRequired,
  endpoint: PropTypes.string.isRequired,
  index: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
};

export default UserTags;
