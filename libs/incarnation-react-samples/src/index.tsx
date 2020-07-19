import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import { Incarnation, Observe } from "incarnation-react";

import { Hello } from "./components/Hello";

ReactDOM.render(
  <Suspense fallback="">
    <Observe>
      <Hello />
    </Observe>
  </Suspense>,
  document.getElementById("example")
);
