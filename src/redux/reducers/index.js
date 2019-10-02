import { ADD_ARTICLE, DATA_LOADED, PAGE_SIZE } from "../constants.js";

import { GRQ_TABLE_VIEW_DEFAULT } from "../../config.js";

const initialState = {
  // test states
  articles: [],
  remoteArticles: [],
  pageSize: 10,

  // real central states
  esQuery: null,
  facetData: [],
  tableView: GRQ_TABLE_VIEW_DEFAULT, // boolean
  selectedId: null,
  _id: null
};

function rootReducer(state = initialState, action) {
  switch (action.type) {
    case ADD_ARTICLE:
      return {
        ...state,
        articles: state.articles.concat(action.payload)
      };
    case DATA_LOADED:
      return {
        ...state,
        // remoteArticles: state.remoteArticles.concat(action.payload)
        remoteArticles: action.payload
      };
    case PAGE_SIZE:
      return {
        ...state,
        pageSize: action.payload
      };
    default:
      return state;
  }
}

export default rootReducer;
