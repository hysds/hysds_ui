import { RETRIEVE_DATA, GET_QUERY } from "../constants";

const urlParams = new URLSearchParams(window.location.search);

const initialState = {
  onDemandQuery: urlParams.get("query") || null,
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
        // query: btoa(action.payload) // converting to base64
        query: action.payload
      };
    default:
      return state;
  }
};

export default toscaReducer;
