import { combineReducers } from "redux";

import toscaReducer from "./toscaReducer";
import reactivesearchReducer from "./reactivesearchReducer";
import themeReducer from "./themeReducer";

const rootReducer = combineReducers({
  themeReducer,
  reactivesearchReducer,
  toscaReducer
});

export default rootReducer;
