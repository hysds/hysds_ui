import {
  GET_DATASET_ID,
  CLEAR_ALL_CUSTOM_COMPONENTS,
  CLEAR_CUSTOM_COMPONENTS,
  RETRIEVE_DATA,
  GET_QUERY,
  UPDATE_SEARCH_QUERY,
  EDIT_ON_DEMAND_QUERY,
  EDIT_ON_DEMAND_PRIORITY
} from "../constants.js";

// example action (in case we need to make API requets)
export const getData = n => async dispatch => {
  let req = await fetch("https://jsonplaceholder.typicode.com/posts");
  const json = req.json();
  return dispatch({ type: "DATA_LOADED", payload: json.slice(0, n) });
};

// ********************************************************************** //
// REACTIVESEARCH ACTIONS
export const clickDatasetId = payload => ({
  type: GET_DATASET_ID,
  payload
});

export const clearAllCustomComponents = payload => ({
  type: CLEAR_ALL_CUSTOM_COMPONENTS,
  payload
});

export const clearCustomComponent = payload => ({
  type: CLEAR_CUSTOM_COMPONENTS,
  payload
});

// ********************************************************************** //
// TOSCA ACTIONS
export const retrieveData = payload => ({
  type: RETRIEVE_DATA,
  payload
});

export const getQuery = payload => {
  return {
    type: GET_QUERY,
    payload
  };
};

export const updateSearchQuery = payload => ({
  type: UPDATE_SEARCH_QUERY,
  payload
});

// ********************************************************************** //
// TOSCA ON DEMAND ACTIONS
export const editOnDemandQuery = payload => ({
  type: EDIT_ON_DEMAND_QUERY,
  payload
});

export const editOnDemandPriority = payload => ({
  type: EDIT_ON_DEMAND_PRIORITY,
  payload
});
