import {
  GET_DATASET_ID, // reactivesearch
  CLEAR_ALL_CUSTOM_COMPONENTS,
  CLEAR_CUSTOM_COMPONENTS,
  RETRIEVE_DATA,
  SET_QUERY,
  EDIT_QUERY, // on-demand
  VALIDATE_QUERY,
  EDIT_PRIORITY,
  EDIT_JOB_PARAMS,
  CHANGE_JOB_TYPE,
  CHANGE_QUEUE,
  EDIT_TAG,
  CLEAR_JOB_PARAMS,
  EDIT_RULE_NAME,
  GLOBAL_SEARCH_USER_RULES,
  BBOX_EDIT,
  CLICK_QUERY_REGION,
  UNCLICK_QUERY_REGION,
  EDIT_THEME,
  EDIT_CUSTOM_FILTER_ID,
  CLEAR_REDUX_STORE
} from "../constants.js";

import {
  constructUrl,
  clearUrlJobParams,
  editUrlJobParam,
  validateUrlQueryParam
} from "../../utils";

// ********************************************************************** //
// REACTIVESEARCH ACTIONS
export const clearReduxStore = () => ({
  type: CLEAR_REDUX_STORE
});

export const clickDatasetId = id => ({
  type: GET_DATASET_ID,
  payload: id
});

export const editCustomFilterId = (componentId, value) => ({
  type: EDIT_CUSTOM_FILTER_ID,
  payload: {
    [componentId]: value
  }
});

export const clearAllCustomComponents = payload => ({
  type: CLEAR_ALL_CUSTOM_COMPONENTS,
  payload
});

export const clearCustomComponent = id => ({
  type: CLEAR_CUSTOM_COMPONENTS,
  payload: id
});

// ********************************************************************** //
// TOSCA ACTIONS
export const retrieveData = data => ({
  type: RETRIEVE_DATA,
  payload: data
});

export const setQuery = query => {
  return {
    type: SET_QUERY,
    payload: query
  };
};

// ********************************************************************** //
// TOSCA ON DEMAND ACTIONS
export const editQuery = (payload, url = false) => {
  if (url) validateUrlQueryParam(payload);
  return {
    type: EDIT_QUERY,
    payload
  };
};

export const validateQuery = payload => ({
  type: VALIDATE_QUERY,
  payload
});

export const editJobPriority = (payload, url = false) => {
  if (url) constructUrl("priority", payload);
  return {
    type: EDIT_PRIORITY,
    payload
  };
};

export const changeJobType = (payload, url = false) => {
  if (url) {
    clearUrlJobParams(payload);
    constructUrl("job_spec", payload.jobSpec);
    constructUrl("hysds_io", payload.hysdsio);
  }
  return {
    type: CHANGE_JOB_TYPE,
    payload
  };
};

export const changeQueue = payload => ({
  type: CHANGE_QUEUE,
  payload
});

export const editTags = (payload, url = false) => {
  if (url) constructUrl("tags", payload);
  return {
    type: EDIT_TAG,
    payload
  };
};

export const editParams = (payload, url = false) => {
  if (url) editUrlJobParam(payload.name, payload.value);
  return {
    type: EDIT_JOB_PARAMS,
    payload
  };
};

export const clearJobParams = payload => ({
  type: CLEAR_JOB_PARAMS,
  payload
});

export const editRuleName = (payload, url = false) => {
  if (url) constructUrl("rule_name", payload);
  return {
    type: EDIT_RULE_NAME,
    payload
  };
};

export const globalSearchUserRules = string => ({
  type: GLOBAL_SEARCH_USER_RULES,
  payload: string
});

export const bboxEdit = bbox => ({
  type: BBOX_EDIT,
  payload: bbox
});

export const clickQueryRegion = bbox => ({
  type: CLICK_QUERY_REGION,
  payload: bbox
});

export const unclickQueryRegion = () => ({
  type: UNCLICK_QUERY_REGION
});

export const editTheme = darkMode => ({
  type: EDIT_THEME,
  payload: darkMode
});
