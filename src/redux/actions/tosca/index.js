import {
  EDIT_DATA_COUNT,
  GET_JOB_LIST,
  LOAD_JOB_PARAMS,
  LOAD_QUEUE_LIST,
  LOAD_QUEUE,
  LOAD_USER_RULES,
  LOAD_USER_RULE,
  TOGGLE_USER_RULE,
  USER_RULE_ACTION_LOADING,
  DELETE_USER_RULE,
  LOAD_USER_RULES_TAGS,
  LOAD_TIME_LIMITS,
  LOAD_DISK_USAGE,
  // EDIT_ENABLE_DEDUP,
} from "../../constants.js";

import { editUrlDataCount } from "../../../utils";

import {
  MOZART_REST_API_V2,
  GRQ_REST_API_V1,
  GRQ_ES_URL,
  GRQ_ES_INDICES,
} from "../../../config";

export const editDataCount = (query) => (dispatch) => {
  const ES_QUERY_DATA_COUNT_ENDPOINT = `${GRQ_ES_URL}/${GRQ_ES_INDICES}/_count`;

  try {
    let parsedQuery = { query: JSON.parse(query) };
    const headers = {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify(parsedQuery),
    };

    fetch(ES_QUERY_DATA_COUNT_ENDPOINT, headers)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          editUrlDataCount(null);
          dispatch({ type: EDIT_DATA_COUNT, payload: null });
        } else {
          editUrlDataCount(data.count);
          dispatch({ type: EDIT_DATA_COUNT, payload: data.count });
        }
      });
  } catch (err) {
    editUrlDataCount(null);
    dispatch({ type: EDIT_DATA_COUNT, payload: null });
  }
};

export const getOnDemandJobs = () => (dispatch) => {
  const getJobsEndpoint = `${GRQ_REST_API_V1}/grq/on-demand`;
  return fetch(getJobsEndpoint)
    .then((res) => res.json())
    .then((data) => {
      dispatch({
        type: GET_JOB_LIST,
        payload: data.result,
      });
    });
};

export const getQueueList = (jobSpec) => (dispatch) => {
  const getQueuesEndpoint = `${MOZART_REST_API_V2}/queue/list?id=${jobSpec}`;
  return fetch(getQueuesEndpoint)
    .then((res) => res.json())
    .then((data) => {
      dispatch({
        type: LOAD_QUEUE_LIST,
        payload: data.result.queues,
      });
      dispatch({
        type: LOAD_QUEUE,
        payload: data.result.recommended,
      });
    });
};

// /job-params
export const getParamsList = (jobSpec) => (dispatch) => {
  const getParamsListEndpoint = `${GRQ_REST_API_V1}/grq/job-params?job_type=${jobSpec}`;
  return fetch(getParamsListEndpoint)
    .then((res) => res.json())
    .then((data) => {
      dispatch({
        type: LOAD_JOB_PARAMS,
        payload: data,
      });
      dispatch({
        type: LOAD_TIME_LIMITS,
        payload: {
          timeLimit: data.time_limit,
          softTimeLimit: data.soft_time_limit,
        },
      });
      dispatch({
        type: LOAD_DISK_USAGE,
        payload: data.disk_usage,
      });
    });
};

// TOSCA USER RULES ACTIONS
export const getUserRules = () => (dispatch) => {
  const getUserRulesEndpoint = `${GRQ_REST_API_V1}/grq/user-rules`;
  return fetch(getUserRulesEndpoint)
    .then((res) => res.json())
    .then((data) =>
      dispatch({
        type: LOAD_USER_RULES,
        payload: data.rules,
      })
    );
};

export const getUserRule = (id) => (dispatch) => {
  const getUserRuleEndpoint = `${GRQ_REST_API_V1}/grq/user-rules?id=${id}`;
  return fetch(getUserRuleEndpoint)
    .then((res) => res.json())
    .then((data) => {
      dispatch({
        type: LOAD_USER_RULE,
        payload: data.rule,
      });
      dispatch({
        type: LOAD_TIME_LIMITS,
        payload: {
          timeLimit: data.rule.time_limit,
          softTimeLimit: data.rule.soft_time_limit,
        },
      });
      dispatch({
        type: LOAD_DISK_USAGE,
        payload: data.rule.disk_usage,
      });

      const jobSpec = data.rule.job_spec;

      const getQueuesEndpoint = `${MOZART_REST_API_V2}/queue/list?id=${jobSpec}`;
      fetch(getQueuesEndpoint) // fetching the queue list for this job
        .then((res) => res.json())
        .then((data) =>
          dispatch({
            type: LOAD_QUEUE_LIST,
            payload: data.result.queues,
          })
        )
        .catch((err) => console.error(err));

      const getParamsListEndpoint = `${GRQ_REST_API_V1}/grq/job-params?job_type=${jobSpec}`;
      fetch(getParamsListEndpoint)
        .then((res) => res.json())
        .then((data) => {
          delete data.enable_dedup;
          dispatch({
            type: LOAD_JOB_PARAMS,
            payload: data,
          });
        });
    });
};

export const getUserRulesTags = () => (dispatch) => {
  const endpoint = `${GRQ_REST_API_V1}/grq/user-rules-tags`;
  fetch(endpoint)
    .then((res) => res.json())
    .then((data) =>
      dispatch({
        type: LOAD_USER_RULES_TAGS,
        payload: data.tags,
      })
    );
};

export const toggleUserRule = (index, id, enabled) => (dispatch) => {
  dispatch({
    type: USER_RULE_ACTION_LOADING,
    payload: { index, id },
  });

  const toggleUserRuleEndpoint = `${GRQ_REST_API_V1}/grq/user-rules`;
  const payload = {
    id: id,
    enabled,
  };
  const headers = {
    headers: { "Content-Type": "application/json" },
    method: "PUT",
    body: JSON.stringify(payload),
  };

  return fetch(toggleUserRuleEndpoint, headers)
    .then((res) => res.json())
    .then((data) => {
      dispatch({
        type: TOGGLE_USER_RULE,
        payload: { ...data, index, id },
      });
    });
};

export const deleteUserRule = (index, id) => (dispatch) => {
  const deleteRuleEndpoint = `${GRQ_REST_API_V1}/grq/user-rules?id=${id}`;
  return fetch(deleteRuleEndpoint, { method: "DELETE" })
    .then((res) => res.json())
    .then((data) =>
      dispatch({
        type: DELETE_USER_RULE,
        payload: { index, id },
      })
    );
};
