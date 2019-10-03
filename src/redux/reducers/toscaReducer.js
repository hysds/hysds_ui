import { RETRIEVE_DATA, GET_QUERY } from "../constants";

const initialState = {
  query: null,
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
        query: btoa(action.payload) // converting to base64
      };
    default:
      return state;
  }
};

export default toscaReducer;
