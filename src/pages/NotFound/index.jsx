import React, { Fragment } from "react";
import { Helmet } from "react-helmet";

import "./style.css";

function NotFound() {
  return (
    <Fragment>
      <Helmet>
        <title>404 - Page Not Found</title>
      </Helmet>
      <div className="page-not-found">
        <h1>404 Page Not Found</h1>
      </div>
    </Fragment>
  );
}

export default NotFound;
