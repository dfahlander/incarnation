import React, { memo, Suspense } from "react";

class ClassComponent extends React.Component {
  render() {
    return <p>Class render</p>;
  }
}

class PureClassComponent extends React.PureComponent {
  render() {
    return <p>Pure component</p>;
  }
}

const MemoedComponent = memo((props) => <p>Memoed functional component</p>);

export function SeeJsxTypes() {
  return (
    <>
      <p>Hej</p>
      <Suspense fallback={<p>Loading...</p>}>
        <ClassComponent />
        <PureClassComponent />
        <MemoedComponent />
      </Suspense>
    </>
  );
}

window["SeeJsxTypes"] = SeeJsxTypes();
