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
  DELETE_USER_RULE
} from "../../constants.js";

import { editUrlDataCount } from "../../../utils";

import {
  GRQ_REST_API_V1,
  GRQ_ES_URL,
  GRQ_ES_INDICES
} from "../../../config/tosca";

import { MOZART_REST_API_V2 } from "../../../config/figaro";

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

export const getQueueList = jobSpec => dispatch => {
  const getQueuesEndpoint = `${MOZART_REST_API_V2}/queue/list?id=${jobSpec}`;
  return fetch(getQueuesEndpoint)
    .then(res => res.json())
    .then(data => {
      dispatch({
        type: LOAD_QUEUE_LIST,
        payload: data.result.queues
      });
      dispatch({
        type: LOAD_QUEUE,
        payload: data.result.recommended
      });
    });
};

// /job-params
export const getParamsList = jobSpec => dispatch => {
  const getParamsListEndpoint = `${GRQ_REST_API_V1}/grq/job-params?job_type=${jobSpec}`;
  return fetch(getParamsListEndpoint)
    .then(res => res.json())
    .then(data => {
      dispatch({
        type: LOAD_JOB_PARAMS,
        payload: data
      });
    });
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
