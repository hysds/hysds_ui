import React from "react";
import upArrow from "../../images/arrow-up.png";
import "./style.css";

export default () => (
  <img
    type="image"
    src={upArrow}
    className="scroll-top-button"
    onClick={() => window.scrollTo(0, 0)}
  />
);
