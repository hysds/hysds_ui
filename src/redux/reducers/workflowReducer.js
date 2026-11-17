import {
  WORKFLOW_SPEC_LOADING,
  WORKFLOW_SPEC_LOADED,
  WORKFLOW_SPEC_FAILED,
} from "../constants";

// specs: { [spec_id]: { status: "loading" | "loaded" | "failed", spec?: {...} } }
// A spec is fetched once per spec_id and kept for the life of the page.
const initialState = {
  specs: {},
};

const workflowReducer = (state = initialState, action) => {
  switch (action.type) {
    case WORKFLOW_SPEC_LOADING:
      return {
        ...state,
        specs: { ...state.specs, [action.id]: { status: "loading" } },
      };
    case WORKFLOW_SPEC_LOADED:
      return {
        ...state,
        specs: {
          ...state.specs,
          [action.id]: { status: "loaded", spec: action.payload },
        },
      };
    case WORKFLOW_SPEC_FAILED:
      return {
        ...state,
        specs: { ...state.specs, [action.id]: { status: "failed", notFound: !!action.notFound, message: action.message } },
      };
    default:
      return state;
  }
};

export default workflowReducer;
