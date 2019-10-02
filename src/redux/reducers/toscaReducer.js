import { GRQ_TABLE_VIEW_DEFAULT } from "../../config.js";

const initialState = {
  // states for the tosca page (TODO: need to implement these)
  esQuery: null,
  facetData: [],
  tableView: GRQ_TABLE_VIEW_DEFAULT // boolean
};

const toscaReducer = (state = initialState, action) => {
  return state;
};

export default toscaReducer;
