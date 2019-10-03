import {
  GET_DATASET_ID,
  CLEAR_ALL_CUSTOM_COMPONENTS,
  CLEAR_CUSTOM_COMPONENTS
} from "../constants.js";
import { ID_COMPONENT } from "../../config.js";

// reactivesearch puts double quotes around the filters in the URL, need to remove thwm
const stripEndQuotes = s => {
  var t = s.length;
  if (s.charAt(0) == '"') s = s.substring(1, t--);
  if (s.charAt(--t) == '"') s = s.substring(0, t);
  return s;
};

// grabbing custom filters from URL on page load
const urlParams = new URLSearchParams(window.location.search);

// custom ReactiveComponent id's
const initialState = {
  // _id: urlParams.get("_id") ? stripEndQuotes(urlParams.get("_id")) : null
  _id: null
};

const reactivesearchReducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_DATASET_ID:
      return {
        ...state,
        _id: action.payload
      };

    // CUSTOM COMPONENT HAS A CLEAR EVENT (NEED TO FIGURE OUT TO HANDLE ALL AT ONCE)
    case CLEAR_ALL_CUSTOM_COMPONENTS:
      return {
        ...state,
        [ID_COMPONENT]: null
      };

    case CLEAR_CUSTOM_COMPONENTS:
      return {
        ...state,
        [action.payload]: null
      };

    default:
      return state;
  }
};

export default reactivesearchReducer;
