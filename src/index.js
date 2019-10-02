import React from "react";
import ReactDOM from "react-dom";
import Routes from "./pages/Routes.jsx";

import { Provider } from "react-redux";
import store from "./redux/store/index.js";

const Application = (
  <Provider store={store}>
    <Routes />
  </Provider>
);

ReactDOM.render(Application, document.getElementById("app"));
