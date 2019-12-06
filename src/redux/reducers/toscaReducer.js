import {
  RETRIEVE_DATA,
  GET_QUERY,
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
  EDIT_DATA_COUNT
} from "../constants";

import {
  constructUrl,
  sanitizePriority,
  validateUrlJob,
  extractJobParams,
  clearUrlJobParams,
  editUrlJobParam,
  validateUrlQueryParam,
  editUrlDataCount
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
  jobType: urlParams.get("job_type") || null,
  hysdsio: null,
  queueList: [],
  queue: null,
  paramsList: [],
  params: defaultUrlJobParams || {},
  submissionType: null,
  tags: urlParams.get("tags") || null
};

const toscaReducer = (state = initialState, action) => {
  switch (action.type) {
    // main-page
    case RETRIEVE_DATA:
      return {
        ...state,
        data: action.payload.data,
        dataCount: action.payload.resultStats.numberOfResults
      };
    case GET_QUERY:
      return {
        ...state,
        query: action.payload
      };

    // on-demand page
    case EDIT_QUERY:
      validateUrlQueryParam(action.payload);
      return {
        ...state,
        query: action.payload
      };
    case VALIDATE_QUERY:
      return {
        ...state,
        validQuery: action.payload
      };
    case GET_JOB_LIST:
      const newJobList = action.payload.map(job => ({
        label: job.version ? `${job.label} [${job.version}]` : job.label,
        value: job.value
      }));

      return {
        ...state,
        jobList: newJobList,
        jobType: validateUrlJob(state.jobType, action.payload)
          ? state.jobType
          : ""
      };
    case LOAD_JOB_PARAMS:
      const params = action.payload.params || [];

      let defaultParams = {};
      params.map(p => {
        let name = p.name;
        defaultParams[name] = p.default || state.params[name] || null; // THIS IS THE BUG
      });

      return {
        ...state,
        paramsList: params,
        submissionType: action.payload.submission_type,
        hysdsio: action.payload.hysds_io,
        params: defaultParams
      };
    case CHANGE_JOB_TYPE:
      clearUrlJobParams(action.payload);
      constructUrl("job_type", action.payload);
      return {
        ...state,
        jobType: action.payload,
        params: {}
      };
    case LOAD_QUEUE_LIST:
      const queueList = action.payload.queues;
      const recommendedQueues = action.payload.recommended;
      let defaultQueue =
        recommendedQueues.length > 0 ? recommendedQueues[0] : null;

      return {
        ...state,
        queueList: queueList.map(queue => ({ label: queue, value: queue })),
        queue: defaultQueue
      };
    case CHANGE_QUEUE:
      return {
        ...state,
        queue: action.payload
      };
    case EDIT_PRIORITY:
      constructUrl("priority", action.payload);
      return {
        ...state,
        priority: action.payload
      };
    case EDIT_TAG:
      constructUrl("tags", action.payload);

      return {
        ...state,
        tags: action.payload
      };
    case EDIT_JOB_PARAMS:
      const newParams = {
        ...state.params,
        ...{ [action.payload.name]: action.payload.value }
      };
      editUrlJobParam(action.payload.name, action.payload.value);
      return {
        ...state,
        params: newParams
      };
    case EDIT_DATA_COUNT:
      editUrlDataCount(action.payload);
      return {
        ...state,
        dataCount: action.payload
      };
    default:
      return state;
  }
};

export default toscaReducer;
