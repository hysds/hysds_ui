import {
  GET_DATASET_ID,
  CLEAR_ALL_CUSTOM_COMPONENTS,
  CLEAR_CUSTOM_COMPONENTS
} from "../constants.js";

// example action
export const getData = n => async dispatch => {
  let req = fetch("https://jsonplaceholder.typicode.com/posts");
  const json = req.json();
  return dispatch({ type: "DATA_LOADED", payload: json.slice(0, n) });
};

export const clickDatasetId = payload => {
  return {
    type: GET_DATASET_ID,
    payload
  };
};

export const clearAllCustomComponents = payload => {
  return {
    type: CLEAR_ALL_CUSTOM_COMPONENTS,
    payload
  };
};

export const clearCustomComponent = payload => {
  return {
    type: CLEAR_CUSTOM_COMPONENTS,
    payload
  };
};
