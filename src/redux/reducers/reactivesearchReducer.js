import {
  GET_DATASET_ID,
  CLEAR_ALL_CUSTOM_COMPONENTS,
  CLEAR_CUSTOM_COMPONENTS,
  UPDATE_SEARCH_QUERY,
  BBOX_EDIT
} from "../constants.js";
import { ID_COMPONENT, QUERY_SEARCH_COMPONENT_ID } from "../../config.js";

// reactivesearch puts double quotes around the filters in the URL, need to remove thwm
const stripEndQuotes = s => {
  var t = s.length;
  if (s.charAt(0) == '"') s = s.substring(1, t--);
  if (s.charAt(--t) == '"') s = s.substring(0, t);
  return s;
};

// grabbing custom filters from URL on page load
const urlParams = new URLSearchParams(window.location.search);
const _id = urlParams.get("_id") ? stripEndQuotes(urlParams.get("_id")) : null;
const queryString = urlParams.get(QUERY_SEARCH_COMPONENT_ID)
  ? stripEndQuotes(urlParams.get(QUERY_SEARCH_COMPONENT_ID)).replace(/\\/g, "")
  : null;

// custom ReactiveComponent id's
const initialState = {
  // _id: null,
  _id: _id,
  queryString: queryString,
  userTyping: false, // maybe move this to global reducer?
  bboxText: ""
};

const reactivesearchReducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_DATASET_ID:
      return {
        ...state,
        [ID_COMPONENT]: action.payload
      };

    case UPDATE_SEARCH_QUERY:
      const queryString = action.payload[QUERY_SEARCH_COMPONENT_ID];
      const userTyping = action.payload.userTyping;
      return {
        ...state,
        [QUERY_SEARCH_COMPONENT_ID]: queryString,
        userTyping: userTyping
      };

    case BBOX_EDIT:
      console.log(BBOX_EDIT, action.payload);
      return {
        ...state,
        bboxText: action.payload
      };

    // CUSTOM COMPONENT HAS A CLEAR EVENT (NEED TO FIGURE OUT TO HANDLE ALL AT ONCE)
    case CLEAR_ALL_CUSTOM_COMPONENTS:
      return {
        ...state,
        [ID_COMPONENT]: null,
        [QUERY_SEARCH_COMPONENT_ID]: null,
        userTyping: false
      };

    case CLEAR_CUSTOM_COMPONENTS:
      return {
        ...state,
        [action.payload]: null,
        userTyping: false
      };

    default:
      return state;
  }
};

export default reactivesearchReducer;
