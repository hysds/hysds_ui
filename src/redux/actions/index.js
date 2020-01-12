import {
  GET_DATASET_ID, // reactivesearch
  CLEAR_ALL_CUSTOM_COMPONENTS,
  CLEAR_CUSTOM_COMPONENTS,
  RETRIEVE_DATA,
  GET_QUERY,
  EDIT_QUERY, // on-demand
  VALIDATE_QUERY,
  EDIT_PRIORITY,
  GET_JOB_LIST,
  LOAD_JOB_PARAMS,
  EDIT_JOB_PARAMS,
  CHANGE_JOB_TYPE,
  LOAD_QUEUE_LIST,
  lOAD_QUEUE,
  CHANGE_QUEUE,
  EDIT_TAG,
  EDIT_DATA_COUNT,
  LOAD_USER_RULES, // user-rules
  LOAD_USER_RULE,
  TOGGLE_USER_RULE,
  USER_RULE_ACTION_LOADING,
  CLEAR_JOB_PARAMS,
  EDIT_RULE_NAME,
  DELETE_USER_RULE,
  GLOBAL_SEARCH_USER_RULES,
  BBOX_EDIT,
  CLICK_QUERY_REGION,
  UNCLICK_QUERY_REGION,
  EDIT_THEME
} from "../constants.js";

import {
  constructUrl,
  clearUrlJobParams,
  editUrlJobParam,
  validateUrlQueryParam,
  editUrlDataCount
} from "../../utils";

import {
  GRQ_REST_API_V1,
  MOZART_REST_API_V2,
  GRQ_ES_URL,
  GRQ_ES_INDICES
} from "../../config";

// ********************************************************************** //
// REACTIVESEARCH ACTIONS
export const clickDatasetId = id => ({
  type: GET_DATASET_ID,
  payload: id
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

export const getQuery = query => {
  return {
    type: GET_QUERY,
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

export const changeJobType = (payload, url = false) => {
  if (url) {
    clearUrlJobParams(payload);
    constructUrl("job_type", payload.jobType);
    constructUrl("hysds_io", payload.hysdsio);
  }
  return {
    type: CHANGE_JOB_TYPE,
    payload
  };
};

export const getQueueList = jobType => dispatch => {
  const getQueuesEndpoint = `${MOZART_REST_API_V2}/queue/list?id=${jobType}`;
  return fetch(getQueuesEndpoint)
    .then(res => res.json())
    .then(data => {
      dispatch({
        type: LOAD_QUEUE_LIST,
        payload: data.result.queues
      });
      dispatch({
        type: lOAD_QUEUE,
        payload: data.result.recommended
      });
    });
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
        if (data.status && data.status != 200) {
          editUrlDataCount(null);
          dispatch({ type: EDIT_DATA_COUNT, payload: null });
        } else {
          editUrlDataCount(data.hits.total.value);
          dispatch({ type: EDIT_DATA_COUNT, payload: data.hits.total.value });
        }
      });
  } catch (err) {
    editUrlDataCount(null);
    dispatch({ type: EDIT_DATA_COUNT, payload: null });
  }
};

// ********************************************************************** //
// TOSCA USER RULES ACTIONS
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

export const getUserRule = id => dispatch => {
  const getUserRuleEndpoint = `${GRQ_REST_API_V1}/grq/user-rules?id=${id}`;
  return fetch(getUserRuleEndpoint)
    .then(res => res.json())
    .then(data => {
      dispatch({
        type: LOAD_USER_RULE,
        payload: data.rule
      });
      const jobSpec = data.rule.job_spec;

      const getQueuesEndpoint = `${MOZART_REST_API_V2}/queue/list?id=${jobSpec}`;
      fetch(getQueuesEndpoint) // fetching the queue list for this job
        .then(res => res.json())
        .then(data =>
          dispatch({
            type: LOAD_QUEUE_LIST,
            payload: data.result.queues
          })
        )
        .catch(err => console.error(err));

      const getParamsListEndpoint = `${GRQ_REST_API_V1}/grq/job-params?job_type=${jobSpec}`;
      fetch(getParamsListEndpoint)
        .then(res => res.json())
        .then(data =>
          dispatch({
            type: LOAD_JOB_PARAMS,
            payload: data
          })
        );
    });
};

export const toggleUserRule = (index, id, enabled) => dispatch => {
  dispatch({
    type: USER_RULE_ACTION_LOADING,
    payload: { index, id }
  });

  const toggleUserRuleEndpoint = `${GRQ_REST_API_V1}/grq/user-rules`;
  const payload = {
    id: id,
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
        payload: { ...data, index, id }
      });
    });
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

export const deleteUserRule = (index, id) => dispatch => {
  const deleteRuleEndpoint = `${GRQ_REST_API_V1}/grq/user-rules?id=${id}`;
  return fetch(deleteRuleEndpoint, { method: "DELETE" })
    .then(res => res.json())
    .then(data =>
      dispatch({
        type: DELETE_USER_RULE,
        payload: { index, id }
      })
    );
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
