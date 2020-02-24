import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import { App, UseState, Anarchist, AnarchyParent } from "./App";
import { App2 } from "./App2";
import { App3 } from "./App3";

ReactDOM.render(
  <Suspense fallback={"Loading..."}>
    <App3 />
  </Suspense>,
  document.getElementById("root")
);

console.log("Hello from lab");

const rd = ReactDOM;
//debugger;
