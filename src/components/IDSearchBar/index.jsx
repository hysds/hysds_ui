import React from 'react';

/**
 * ID Search Bar because ReactiveSearch does doesnt allow you to search by _id field in ES
 * TODO: 
 *  add magnifying glass that searches on click
 *  clear the searchbox when clearing the facets
 */
export default class IDSearchBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.defaultValue || ''
    }
    this._handleKeyPress = this._handleKeyPress.bind(this);

    // if query parameters are passed on page load
    if (this.props.selectedValue) {
      this.setQuery(props, props.selectedValue); // passing ES query if query parameter passed
    } else {
      this.setEmptyQuery(props);
    }
  }

  componentDidUpdate(previousProps, previousState) {
    // https://stackoverflow.com/questions/30528348/setstate-inside-of-componentdidupdate
    // so the damn clear filter button actually clears the search
    if (!this.props.selectedValue) {
      this.props.setQuery({
        query: null,
        value: [], // don't know why it works but as long as query: null we're good
        selectedValue: null
      });
    }
  }

  // passing the ES query back to the wrapper: ReactiveComponent
  setQuery(props, value) {
    props.setQuery({
      query: {
        term: {
          _id: value
        }
      },
      value: value,
      selectedValue: value,
    });
  }

  // creating an empty query to send back to ReactiveBase 
  // (so we dont filter field with empty input)
  setEmptyQuery(props) {
    props.setQuery({
      query: null,
      value: null,
      selectedValue: null
    });
  }

  _handleKeyPress(e) {
    if (e.key === 'Enter') {
      this.setState({
        value: e.target.value
      })
      if (e.target.value) {
        this.setQuery(this.props, e.target.value);
      } else {
        this.setEmptyQuery(this.props);
      }
    }
  }

  render() {
    const { selectedValue } = this.props;
    const style = {
      height: 40,
      width: '98%',
      fontSize: 20
    }
    return (
      <input
        type='text'
        className='id-search-bar'
        defaultValue={selectedValue}
        onKeyPress={this._handleKeyPress}
        placeholder='Search By Dataset ID'
        style={style}
      />
    )
  }
}
