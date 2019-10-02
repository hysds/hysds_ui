import { combineReducers } from "redux";
import reactivesearchReducer from "./reactivesearchReducer";
import toscaReducer from "./toscaReducer";

const rootReducer = combineReducers({
  reactivesearchReducer,
  toscaReducer
});

export default rootReducer;
