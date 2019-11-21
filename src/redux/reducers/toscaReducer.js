import {
  RETRIEVE_DATA,
  GET_QUERY,
  EDIT_ON_DEMAND_QUERY,
  EDIT_PRIORITY,
  LOAD_JOBS,
  CHANGE_JOB_TYPE,
  LOAD_QUEUE_LIST,
  CHANGE_QUEUE
} from "../constants";

const urlParams = new URLSearchParams(window.location.search);

const initialState = {
  // main page
  data: [],
  dataCount: 0,

  // on-demand
  onDemandQuery: urlParams.get("query") || null,
  priority: urlParams.get("priority") || null,
  jobList: [],
  jobType: urlParams.get("job") || null,
  queueList: [],
  queue: urlParams.get("queue") || null
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
        onDemandQuery: action.payload
      };
    case LOAD_JOBS:
      return {
        ...state,
        jobList: action.payload
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
    default:
      return state;
  }
};

export default toscaReducer;
