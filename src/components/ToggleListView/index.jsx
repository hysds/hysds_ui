import React from 'react';
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types';

import GreenArrow from '../../images/green-arrow.png';
import RedArrow from '../../images/red-arrow.png';

class ToggleListView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      toggle: false,
      mapImage: null, // cache map image
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

    let davLink = res.urls.filter(url => url.startsWith('http'));
    davLink = davLink.length == 0 ? null : (<button><a style={{ color: 'inherit' }} href={davLink[0]} target='_blank'>Browse</a></button>)

    const display = toggle ? (
      <div
        style={{ display: 'inline-block' }}
        key={res._id}
      >
        <div className='text-head text-overflow full_row'>
          <span className='text-head-info text-overflow'></span>
          <span className='text-head-info text-overflow'></span>
        </div>
        <div className='text-description text-overflow full_row'>
          <ul className='highlight_tags'>
            <a style={{ color: 'inherit' }} href={`/tosca/metadata/${res._index}/${res._id}`} target='_blank'>{res._id}</a>
          </ul>
          <ul>{davLink}</ul>
        </div>
      </div>
    ) : (
        <div style={{ display: 'inline-block' }}>
          <a style={{ color: 'inherit' }} href={`/tosca/metadata/${res._index}/${res._id}`} target='_blank'>{res._id}</a>
        </div>
      );

    return (
      <div
        style={{ marginTop: 20, marginBottom: 20, marginLeft: 20, marginRight: 20, padding: 15, border: '1px solid #bebebe' }}
        key={this.props._id}
      >
        <div style={{ display: 'inline-block', marginRight: 10, fontSize: 40, fontWeight: 800 }} onClick={this._handleToggle}>
          {toggle ? <img src={RedArrow} height={25} /> : <img src={GreenArrow} height={24} />}</div>
        {display}
      </div>
    );
  }
}

ToggleListView.propTypes = {
  res: PropTypes.object.isRequired
};

export default ToggleListView;
