import {
  CHANGE_JOB_TYPE,
  CHANGE_QUEUE,
  CLEAR_JOB_PARAMS,
  CLEAR_REDUX_STORE,
  DELETE_USER_RULE,
  EDIT_DATA_COUNT,
  EDIT_JOB_PARAMS,
  EDIT_PRIORITY,
  EDIT_QUERY,
  EDIT_RULE_NAME,
  EDIT_TAG,
  GET_JOB_LIST,
  SET_QUERY,
  GLOBAL_SEARCH_USER_RULES,
  LOAD_JOB_PARAMS,
  LOAD_QUEUE,
  LOAD_QUEUE_LIST,
  LOAD_USER_RULE,
  LOAD_USER_RULES,
  RETRIEVE_DATA,
  TOGGLE_USER_RULE,
  USER_RULE_ACTION_LOADING,
} from "../constants";

import {
  makeDropdownOptions,
  sanitizePriority,
  extractJobParams,
} from "../../utils";

const urlParams = new URLSearchParams(window.location.search);

let priority = urlParams.get("priority");
priority = sanitizePriority(priority);

let defaultUrlJobParams = extractJobParams(urlParams);

const initialState = {
  // main page
  data: [],
  dataCount: urlParams.get("total") || 0,

  // on-demand
  query: urlParams.get("query") || null,
  validQuery: true,
  priority: priority || null,
  jobList: [],
  jobLabel: null,
  jobSpec: urlParams.get("job_spec") || null,
  hysdsio: urlParams.get("hysds_io") || null,
  queueList: [],
  queue: null,
  paramsList: [],
  params: defaultUrlJobParams || {},
  submissionType: null,
  tags: urlParams.get("tags") || null,
  ruleName: null,
  userRules: [], // store all the rules client side
  filteredRules: [], // client global search for user rules

  toggle: false,
};

const generalReducer = (state = initialState, action) => {
  switch (action.type) {
    case CLEAR_REDUX_STORE:
      return initialState;

    case RETRIEVE_DATA:
      return {
        ...state,
        data: action.payload.data,
        dataCount: action.payload.resultStats.numberOfResults,
      };
    case SET_QUERY:
      return {
        ...state,
        query: action.payload,
      };

    case EDIT_QUERY:
      return {
        ...state,
        query: action.payload,
      };
    case GET_JOB_LIST: {
      const newJobList = makeDropdownOptions(action.payload);
      return {
        ...state,
        jobList: newJobList,
      };
    }
    case LOAD_JOB_PARAMS: {
      const params = action.payload.params || [];
      const defaultParams = {};

      params.map((p) => {
        let name = p.name;
        defaultParams[name] = state.params[name] || p.default || null; // THIS IS THE BUG
      });

      return {
        ...state,
        paramsList: params,
        submissionType: action.payload.submission_type,
        params: defaultParams,
      };
    }
    case CHANGE_JOB_TYPE:
      return {
        ...state,
        jobSpec: action.payload.jobSpec,
        jobLabel: action.payload.label,
        hysdsio: action.payload.hysdsio,
        queue: null,
        queueList: [],
        params: {},
      };
    case LOAD_QUEUE_LIST:
      return {
        ...state,
        queueList: action.payload.map((queue) => ({
          label: queue,
          value: queue,
        })),
      };
    case LOAD_QUEUE: {
      const queues = action.payload;
      const recommendedQueue = queues.length > 0 ? queues[0] : state.queue;
      return {
        ...state,
        queue: recommendedQueue,
      };
    }
    case CHANGE_QUEUE:
      return {
        ...state,
        queue: action.payload,
      };
    case EDIT_PRIORITY:
      return {
        ...state,
        priority: action.payload,
      };
    case EDIT_TAG:
      return {
        ...state,
        tags: action.payload,
      };
    case EDIT_JOB_PARAMS: {
      const newParams = {
        ...state.params,
        ...{ [action.payload.name]: action.payload.value },
      };
      // editUrlJobParam(action.payload.name, action.payload.value);
      return {
        ...state,
        params: newParams,
      };
    }
    case EDIT_DATA_COUNT:
      return {
        ...state,
        dataCount: action.payload,
      };
    case LOAD_USER_RULES:
      return {
        ...state,
        userRules: action.payload,
        filteredRules: action.payload,
      };
    case LOAD_USER_RULE: {
      const { payload } = action;
      return {
        ...state,
        query: payload.query_string,
        jobSpec: payload.job_spec,
        jobLabel: payload.job_spec,
        hysdsio: payload.job_type,
        params: JSON.parse(payload.kwargs),
        ruleName: payload.rule_name,
        queue: payload.queue,
        priority: payload.priority,
      };
    }
    case USER_RULE_ACTION_LOADING: {
      const { index, id } = action.payload;

      const foundFilteredRule = state.filteredRules[index];
      foundFilteredRule.toggleLoading = true;

      const loc = state.userRules.findIndex((x) => x._id === id);
      const foundRule = state.userRules[loc];
      foundRule.toggleLoading = true;

      return {
        ...state,
        userRules: [
          ...state.userRules.slice(0, loc),
          foundRule,
          ...state.userRules.slice(loc + 1),
        ],
        filteredRules: [
          ...state.filteredRules.slice(0, index),
          foundFilteredRule,
          ...state.filteredRules.slice(index + 1),
        ],
      };
    }
    case TOGGLE_USER_RULE: {
      const { index, id, updated } = action.payload;

      const loc = state.userRules.findIndex((x) => x._id === id);
      const foundRule = state.userRules[loc];
      foundRule.enabled = updated.enabled;
      foundRule.toggleLoading = false;

      const foundFilteredRule = state.filteredRules[index];
      foundFilteredRule.enabled = updated.enabled;
      foundFilteredRule.toggleLoading = false;

      return {
        ...state,
        userRules: [
          ...state.userRules.slice(0, loc),
          foundRule,
          ...state.userRules.slice(loc + 1),
        ],
        filteredRules: [
          ...state.filteredRules.slice(0, index),
          foundFilteredRule,
          ...state.filteredRules.slice(index + 1),
        ],
      };
    }
    case CLEAR_JOB_PARAMS:
      return {
        ...state,
        jobSpec: null,
        hysdsio: null,
        queue: null,
        queueList: [],
        queue: null,
        params: {},
        paramsList: [],
      };
    case EDIT_RULE_NAME:
      return {
        ...state,
        ruleName: action.payload,
      };
    case DELETE_USER_RULE: {
      const { index, id } = action.payload;
      const loc = state.userRules.findIndex((x) => x._id === id);

      return {
        ...state,
        userRules: [
          ...state.userRules.slice(0, loc),
          ...state.userRules.slice(loc + 1),
        ],
        filteredRules: [
          ...state.filteredRules.slice(0, index),
          ...state.filteredRules.slice(index + 1),
        ],
      };
    }
    case GLOBAL_SEARCH_USER_RULES: {
      const search = action.payload;
      const filteredRules = state.userRules.filter((value) => {
        return (
          value.rule_name.toLowerCase().includes(search.toLowerCase()) ||
          value.job_spec.toLowerCase().includes(search.toLowerCase()) ||
          value.queue.toLowerCase().includes(search.toLowerCase()) ||
          value.query_string.toLowerCase().includes(search.toLowerCase()) ||
          value.kwargs.toLowerCase().includes(search.toLowerCase()) ||
          value.job_type.toLowerCase().includes(search.toLowerCase()) ||
          value.username.toLowerCase().includes(search.toLowerCase()) ||
          value.modified_time.toLowerCase().includes(search.toLowerCase()) ||
          value.creation_time.toLowerCase().includes(search.toLowerCase())
        );
      });

      return {
        ...state,
        filteredRules,
      };
    }
    default:
      return state;
  }
};

export default generalReducer;
