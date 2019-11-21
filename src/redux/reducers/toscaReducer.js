import {
  RETRIEVE_DATA,
  GET_QUERY,
  EDIT_ON_DEMAND_QUERY,
  EDIT_ON_DEMAND_PRIORITY
} from "../constants";

const urlParams = new URLSearchParams(window.location.search);

const initialState = {
  onDemandQuery: urlParams.get("query") || null,
  onDemandPriority: urlParams.get("priority") || 0,
  data: [],
  dataCount: 0
};

const toscaReducer = (state = initialState, action) => {
  switch (action.type) {
    case RETRIEVE_DATA:
      return {
        ...state,
        data: action.payload.data,
        dataCount: action.payload.resultStats.numberOfResults
      };
    case GET_QUERY:
      return {
        ...state,
        query: action.payload
      };
    case EDIT_ON_DEMAND_QUERY:
      return {
        ...state,
        onDemandQuery: action.payload
      };
    case EDIT_ON_DEMAND_PRIORITY:
      return {
        ...state,
        onDemandPriority: action.payload
      };
    default:
      return state;
  }
};

export default toscaReducer;
