import {
  GET_DATASET_ID,
  CLEAR_ALL_CUSTOM_COMPONENTS,
  CLEAR_CUSTOM_COMPONENTS,
  UPDATE_SEARCH_QUERY,
  BBOX_EDIT,
  CLICK_QUERY_REGION,
  UNCLICK_QUERY_REGION
} from "../constants.js";
import { ID_COMPONENT, QUERY_SEARCH_COMPONENT_ID } from "../../config.js";

// custom ReactiveComponent id's
const initialState = {
  userTyping: false, // maybe move this to global reducer?
  bboxText: null,
  queryRegion: false
};

const reactivesearchReducer = (state = initialState, action) => {
  switch (action.type) {
    case GET_DATASET_ID:
      return {
        ...state,
        [ID_COMPONENT]: action.payload
      };

    case UPDATE_SEARCH_QUERY:
      var queryString = action.payload[QUERY_SEARCH_COMPONENT_ID];
      var userTyping = action.payload.userTyping;
      return {
        ...state,
        [QUERY_SEARCH_COMPONENT_ID]: queryString,
        userTyping: userTyping
      };

    case BBOX_EDIT:
      return {
        ...state,
        bboxText: action.payload
      };

    // CUSTOM COMPONENT HAS A CLEAR EVENT (NEED TO FIGURE OUT TO HANDLE ALL AT ONCE)
    case CLEAR_ALL_CUSTOM_COMPONENTS:
      // return state;

    case CLEAR_CUSTOM_COMPONENTS:
      return {
        ...state,
        [action.payload]: null,
        userTyping: false
      };

    case CLICK_QUERY_REGION:
      return {
        ...state,
        bboxText: action.payload,
        queryRegion: true
      };

    case UNCLICK_QUERY_REGION:
      return {
        ...state,
        queryRegion: false
      };

    default:
      return state;
  }
};

export default reactivesearchReducer;
