import {
  GET_DATASET_ID,
  CLEAR_ALL_CUSTOM_COMPONENTS,
  CLEAR_CUSTOM_COMPONENTS,
  RETRIEVE_DATA,
  GET_QUERY,
  UPDATE_SEARCH_QUERY,
  EDIT_ON_DEMAND_QUERY,
  EDIT_PRIORITY,
  GET_JOB_LIST,
  LOAD_JOB_PARAMS,
  EDIT_JOB_PARAMS,
  CHANGE_JOB_TYPE,
  LOAD_QUEUE_LIST,
  CHANGE_QUEUE,
  EDIT_ON_DEMAND_TAG
} from "../constants.js";

import { GRQ_REST_API_V1, MOZART_REST_API_V2 } from "../../config";

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
export const getjobParamsList = jobType => dispatch => {
  const getjobParamsListEndpoint = `${GRQ_REST_API_V1}/grq/job-params?job_type=${jobType}`;
  return fetch(getjobParamsListEndpoint)
    .then(res => res.json())
    .then(data => {
      dispatch({
        type: LOAD_JOB_PARAMS,
        payload: data.result
      });
    });
};

export const editTags = payload => ({
  type: EDIT_ON_DEMAND_TAG,
  payload
});

export const editJobParams = payload => ({
  type: EDIT_JOB_PARAMS,
  payload
});
