import {
  RETRIEVE_DATA,
  GET_QUERY,
  EDIT_ON_DEMAND_QUERY,
  EDIT_PRIORITY,
  GET_JOB_LIST,
  LOAD_JOB_PARAMS,
  EDIT_JOB_PARAMS,
  CHANGE_JOB_TYPE,
  LOAD_QUEUE_LIST,
  CHANGE_QUEUE,
  EDIT_ON_DEMAND_TAG
} from "../constants";

const urlParams = new URLSearchParams(window.location.search);

const initialState = {
  // main page
  data: [],
  dataCount: 0,

  // on-demand
  query: urlParams.get("query") || null,
  priority: null,
  jobList: [],
  jobType: null,
  queueList: [],
  queue: null,
  paramsList: [],
  params: {},
  tags: null
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
    case EDIT_ON_DEMAND_QUERY:
      return {
        ...state,
        query: action.payload
      };
    case GET_JOB_LIST:
      return {
        ...state,
        jobList: action.payload
      };
    case LOAD_JOB_PARAMS:
      let defaultParams = {};
      action.payload.map(
        param => (defaultParams[[param.name]] = param.default || null)
      );
      return {
        ...state,
        paramsList: action.payload,
        params: defaultParams
      };
    case CHANGE_JOB_TYPE:
      return {
        ...state,
        jobType: action.payload
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
      return {
        ...state,
        priority: action.payload
      };
    case EDIT_ON_DEMAND_TAG:
      return {
        ...state,
        tags: action.payload
      };
    case EDIT_JOB_PARAMS:
      const newParams = {
        ...state.params,
        ...{ [action.payload.name]: action.payload.value }
      };
      return {
        ...state,
        params: newParams
      };
    default:
      return state;
  }
};

export default toscaReducer;
