import {
  GET_DATASET_ID,
  CLEAR_ALL_CUSTOM_COMPONENTS,
  CLEAR_CUSTOM_COMPONENTS
} from "../constants.js";
import { GRQ_TABLE_VIEW_DEFAULT, ID_COMPONENT } from "../../config.js";

const urlParams = new URLSearchParams(window.location.search);

const initialState = {
  // states for the tosca page (TODO: need to implement these)
  esQuery: null,
  facetData: [],
  tableView: GRQ_TABLE_VIEW_DEFAULT, // boolean

  // custom ReactiveComponent id's
  _id: urlParams.get("_id") ? urlParams.get("_id").replace(/"/g, "") : null
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

    // ADD ALL CUSTOM COMPONENT IDS HERE
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
