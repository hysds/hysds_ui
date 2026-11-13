import { combineReducers } from "redux";

import generalReducer from "./generalReducer";
import reactivesearchReducer from "./reactivesearchReducer";
import themeReducer from "./themeReducer";
import workflowReducer from "./workflowReducer";

const rootReducer = combineReducers({
  themeReducer,
  generalReducer,
  reactivesearchReducer,
  workflowReducer,
});

export default rootReducer;
