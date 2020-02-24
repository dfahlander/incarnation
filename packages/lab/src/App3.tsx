import React, { Suspense } from "react";
import { Observer } from "./api3/Observer";

export function App3() {
  return (
    <Observer>
      <Suspense fallback="loading...">
        <MyComponent />
        <MyClassComponent />
      </Suspense>
    </Observer>
  );
}

function MyComponent() {
  return <div>Hejsan</div>;
}

class MyClassComponent extends React.Component {
  render() {
    return <div></div>;
  }
}
