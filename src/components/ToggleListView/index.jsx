import React from "react";
import PropTypes from "prop-types";

import "./style.css";
import GreenArrow from "../../images/green-arrow.png";
import RedArrow from "../../images/red-arrow.png";

class ToggleListView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      toggle: false,
      mapImage: null // cache map image
    };
    this._handleToggle = this._handleToggle.bind(this);
  }

  _handleToggle(e) {
    this.setState({
      toggle: !this.state.toggle
    });
  }

  render() {
    const { res } = this.props; // entire object returned from ES
    const { toggle } = this.state;

    let davLink = null;
    if (res.urls) {
      davLink = res.urls.filter(url => url.startsWith("http"));
      davLink =
        davLink.length == 0 ? null : (
          <a className="on-demand-button" href={davLink[0]} target="_blank">
            Browse
          </a>
        );
    }

    const display = toggle ? (
      <div style={{ display: "inline-block" }} key={`${res._index}/${res._id}`}>
        <div className="text-head text-overflow full_row">
          <span className="text-head-info text-overflow"></span>
          <span className="text-head-info text-overflow"></span>
        </div>
        <div className="text-description text-overflow full_row">
          <ul className="highlight_tags">
            <a
              style={{ color: "inherit" }}
              href={`/tosca/metadata?index=${res._index}&id=${res._id}`}
              target="tosca-metadata-viewer"
            >
              {res._id}
            </a>
          </ul>
          <ul>{davLink}</ul>
        </div>
      </div>
    ) : (
      <div style={{ display: "inline-block" }}>
        <span className="display-box-title">{res.dataset}</span> -{" "}
        <span className="display-box-subtitle">{res._id}</span>
      </div>
    );

    return (
      <div
        style={{
          marginTop: 20,
          marginBottom: 20,
          marginLeft: 20,
          marginRight: 20,
          padding: 15,
          border: "1px solid #bebebe",
          minWidth: 750
        }}
        key={this.props._id}
      >
        <div
          style={{
            display: "inline-block",
            marginRight: 10,
            verticalAlign: "top"
          }}
          onClick={this._handleToggle}
        >
          {toggle ? (
            <input
              type="image"
              className="result-toggle"
              src={RedArrow}
              height={25}
            />
          ) : (
            <input
              type="image"
              className="result-toggle"
              src={GreenArrow}
              height={24}
            />
          )}
        </div>
        {display}
      </div>
    );
  }
}

ToggleListView.propTypes = {
  res: PropTypes.object.isRequired
};

export default ToggleListView;
