import {
  GET_DATASET_ID,
  CLEAR_ALL_CUSTOM_COMPONENTS,
  CLEAR_CUSTOM_COMPONENTS,
  BBOX_EDIT,
  CLICK_QUERY_REGION,
  UNCLICK_QUERY_REGION,
  EDIT_CUSTOM_FILTER_ID,
  CLEAR_REACTIVE_SEARCH_REDUX
} from "../constants.js";
import { ID_COMPONENT } from "../../config/tosca";

// custom ReactiveComponent id's
const initialState = {
  bboxText: null,
  queryRegion: false
};

const reactivesearchReducer = (state = initialState, action) => {
  switch (action.type) {
    case CLEAR_REACTIVE_SEARCH_REDUX:
      return initialState;

    case GET_DATASET_ID:
      return {
        ...state,
        [ID_COMPONENT]: action.payload
      };

    case EDIT_CUSTOM_FILTER_ID:
      return {
        ...state,
        ...action.payload
      };

    case BBOX_EDIT:
      return {
        ...state,
        bboxText: action.payload
      };

    // CUSTOM COMPONENT HAS A CLEAR EVENT (NEED TO FIGURE OUT TO HANDLE ALL AT ONCE)
    case CLEAR_ALL_CUSTOM_COMPONENTS:
      break;

    case CLEAR_CUSTOM_COMPONENTS:
      return {
        ...state,
        [action.payload]: null
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
