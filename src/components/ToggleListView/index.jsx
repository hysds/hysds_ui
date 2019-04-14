import React from 'react';
import PropTypes from 'prop-types';

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

    const display = toggle ? (
      <div
        style={{ margin: 20 }}
        key={res._id}
      >
        <div className='text-head text-overflow full_row'>
          <span className='text-head-info text-overflow'>
            {res.Dest ? res.Dest + ' ' : ' '} -
            </span>
          <span className='text-head-info text-overflow'>
            {res.Carrier ? res.Carrier : ''} - {res.Origin ? res.Origin : ''} -
            </span>
        </div>
        <div className='text-description text-overflow full_row'>
          <ul className='highlight_tags'>
            {res.AvgTicketPrice ? `Priced: $${Math.round(res.AvgTicketPrice)}` : 'Free Test Drive '} -
              <a href={`tosca/metadata/${res._id}`} target='_blank'>{res._id}</a>
          </ul>
        </div>
      </div>
    ) : (
        <div style={{ width: '100%' }}>
          <a href={`tosca/metadata/${res._id}`} target='_blank'>{res._id}</a>
        </div>
      );

    return (
      <div
        style={{ marginTop: 20, marginBottom: 20, marginLeft: 40, marginRight: 40, border: '1px solid black' }}
        key={this.props._id}
        onClick={this._handleToggle}
      >
        <div>{toggle ? '-' : '+'}</div>
        {display}
        {toggle ? (<div><br /></div>) : null}
      </div>
    );
  }
}

ToggleListView.propTypes = {
  res: PropTypes.object.isRequired
};

export default ToggleListView;
