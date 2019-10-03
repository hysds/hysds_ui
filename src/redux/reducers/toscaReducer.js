import { RETRIEVE_DATA, GET_QUERY } from "../constants";

const initialState = {
  // states for the tosca page (TODO: need to implement these)
  query: null,
  data: []
};

const toscaReducer = (state = initialState, action) => {
  switch (action.type) {
    case RETRIEVE_DATA:
      return {
        ...state,
        data: action.payload.data
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
