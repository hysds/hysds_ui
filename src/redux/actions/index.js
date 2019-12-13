import {
  // reactivesearch
  GET_DATASET_ID,
  CLEAR_ALL_CUSTOM_COMPONENTS,
  CLEAR_CUSTOM_COMPONENTS,
  RETRIEVE_DATA,
  GET_QUERY,
  UPDATE_SEARCH_QUERY,

  // on-demand
  EDIT_QUERY,
  VALIDATE_QUERY,
  EDIT_PRIORITY,
  GET_JOB_LIST,
  LOAD_JOB_PARAMS,
  EDIT_JOB_PARAMS,
  CHANGE_JOB_TYPE,
  LOAD_QUEUE_LIST,
  CHANGE_QUEUE,
  EDIT_TAG,
  EDIT_DATA_COUNT,

  // user-rules
  LOAD_USER_RULES,
  TOGGLE_USER_RULE
} from "../constants.js";

import {
  GRQ_REST_API_V1,
  MOZART_REST_API_V2,
  GRQ_ES_URL,
  GRQ_ES_INDICES
} from "../../config";

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
export const editQuery = payload => ({
  type: EDIT_QUERY,
  payload
});

export const validateQuery = payload => ({
  type: VALIDATE_QUERY,
  payload
});

export const editJobPriority = payload => ({
  type: EDIT_PRIORITY,
  payload
});

export const getOnDemandJobs = () => dispatch => {
  const getJobsEndpoint = `${GRQ_REST_API_V1}/grq/on-demand`;
  return fetch(getJobsEndpoint)
    .then(res => res.json())
    .then(data =>
      dispatch({
        type: GET_JOB_LIST,
        payload: data.result
      })
    );
};

export const changeJobType = payload => ({
  type: CHANGE_JOB_TYPE,
  payload
});

export const getQueueList = jobType => dispatch => {
  const getQueuesEndpoint = `${MOZART_REST_API_V2}/queue/list?id=${jobType}`;
  return fetch(getQueuesEndpoint)
    .then(res => res.json())
    .then(data =>
      dispatch({
        type: LOAD_QUEUE_LIST,
        payload: data.result
      })
    );
};

export const changeQueue = payload => ({
  type: CHANGE_QUEUE,
  payload
});

// /job-params
export const getParamsList = jobType => dispatch => {
  const getParamsListEndpoint = `${GRQ_REST_API_V1}/grq/job-params?job_type=${jobType}`;
  return fetch(getParamsListEndpoint)
    .then(res => res.json())
    .then(data => {
      dispatch({
        type: LOAD_JOB_PARAMS,
        payload: data
      });
    });
};

export const editTags = payload => ({
  type: EDIT_TAG,
  payload
});

export const editParams = payload => ({
  type: EDIT_JOB_PARAMS,
  payload
});

export const editDataCount = query => dispatch => {
  const ES_QUERY_DATA_COUNT_ENDPOINT = `${GRQ_ES_URL}/${GRQ_ES_INDICES}/_search?size=0`;

  try {
    let parsedQuery = { query: JSON.parse(query) };
    const headers = {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify(parsedQuery)
    };

    fetch(ES_QUERY_DATA_COUNT_ENDPOINT, headers)
      .then(res => res.json())
      .then(data => {
        if (data.status && data.status != 200)
          dispatch({ type: EDIT_DATA_COUNT, payload: null });
        else
          dispatch({ type: EDIT_DATA_COUNT, payload: data.hits.total.value });
      });
  } catch (err) {
    dispatch({ type: EDIT_DATA_COUNT, payload: null });
  }
};

export const getUserRules = () => dispatch => {
  const getUserRulesEndpoint = `${GRQ_REST_API_V1}/grq/user-rules`;
  return fetch(getUserRulesEndpoint)
    .then(res => res.json())
    .then(data =>
      dispatch({
        type: LOAD_USER_RULES,
        payload: data.rules
      })
    );
};

export const toggleUserRule = (ruleId, enabled) => dispatch => {
  const toggleUserRuleEndpoint = `${GRQ_REST_API_V1}/grq/user-rules`;
  const payload = {
    id: ruleId,
    enabled
  };
  const headers = {
    headers: { "Content-Type": "application/json" },
    method: "PUT",
    body: JSON.stringify(payload)
  };

  return fetch(toggleUserRuleEndpoint, headers)
    .then(res => res.json())
    .then(data => {
      dispatch({
        type: TOGGLE_USER_RULE,
        payload: data
      });
    });
};
