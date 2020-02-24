import React, { useState, useEffect } from "react";
import { ReactSharedInternals, FiberNode } from "./api/ReactSharedInternals";
import { TSON } from "./TSON";

export function App2() {
  return <Component />;
}

function tson(fiber: any) {
  return TSON.stringify(
    {
      ...fiber,
      return: "foo",
      child: "foo",
      _debugOwner: "foo",
      alternate: "foo"
    },
    null,
    2
  );
}

const fiberSet = new Set<FiberNode>();
function Component() {
  const fiber = ReactSharedInternals.ReactCurrentOwner.current;
  console.log(tson(ReactSharedInternals));
  debugger;
  if (!fiberSet.has(fiber)) {
    console.log("Not has fiber");
    fiberSet.add(fiber);
  } else {
    console.log("Has fiber", fiberSet.size);
  }
  const [counter, setCounter] = useState(0);
  useEffect(() => {
    if (counter < 3)
      setTimeout(() => {
        console.log("E" + counter, tson(fiber));
        console.log(
          "E " + counter + " alternate(nonmounted) ",
          fiber.alternate ? tson(fiber.alternate) : null
        );
        setCounter(counter + 1);
      }, 1000);
  });
  return <div>{counter}</div>;
}
