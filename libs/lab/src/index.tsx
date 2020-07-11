import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import { App, UseState, Anarchist, AnarchyParent } from "./App";
import { App2 } from "./App2";
import { App3 } from "./App3";
import { SeeJsxTypes } from "./SeeJsxTypes";

ReactDOM.render(
  <Suspense fallback={"Loading..."}>
    <SeeJsxTypes />
  </Suspense>,
  document.getElementById("root")
);

console.log("Hello from lab");

const rd = ReactDOM;
//debugger;
