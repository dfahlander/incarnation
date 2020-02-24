import React, { useEffect, useState } from "react";
import { ReactSharedInternals } from "./api/ReactSharedInternals";
import { TSON } from "./TSON";
import { addEffect } from "./api/addEffect";
import { adhocEffect } from "./api/adhocEffect";
import { readContext } from "./api/readContext";
import { ObserverContext } from "./api2/Observer";
//import ReactReconciler from "react-reconciler";

class MyIterable {
  *[Symbol.iterator]() {
    const fiberNode = ReactSharedInternals.ReactCurrentOwner.current;
    console.log("From iterable", TSON.stringify(fiberNode, null, 2));
    yield <div key="1">Hej</div>;
  }
}

export function App() {
  const fiberNode = ReactSharedInternals.ReactCurrentOwner.current;
  console.log("before useEffect", TSON.stringify(fiberNode, null, 2));
  useEffect(
    function myEffect() {
      console.log("running myEffect", TSON.stringify(fiberNode, null, 2));
      return function myCleanup() {
        console.log("running myCleanup", TSON.stringify(fiberNode, null, 2));
      };
    },
    ["myDep"]
  );
  console.log("after useEffect", TSON.stringify(fiberNode, null, 2));
  const myIt = new MyIterable();
  return <div>Hello from lab: {myIt}</div>;
}

export function UseState() {
  const fiberNode = ReactSharedInternals.ReactCurrentOwner.current;
  console.log("before useState", TSON.stringify(fiberNode, null, 2));
  const [] = useState("myState");
  console.log("after useState", TSON.stringify(fiberNode, null, 2));
  return <div>UseState</div>;
}

const myIdSymbol = Symbol();
let globalCounter = 0;
export function Anarchist() {
  //console.log("before pushEffect():", TSON.stringify(fiberNode, null, 2));
  console.log("Rendering...");
  /*addEffect(
    function thePushEffect() {
      console.log("In pushEffect!");
    },
    function thePushCleanup() {
      console.log("In my cleanup!");
    }
  );*/
  const fiberNode = ReactSharedInternals.ReactCurrentOwner.current;

  if (globalCounter === 0)
    throw new Promise(resolve =>
      setTimeout(() => {
        ++globalCounter;
        resolve();
      }, 500)
    );

  const ob = readContext(ObserverContext);

  /*console.log(
    "before all hooks",
    TSON.stringify(ReactSharedInternals, null, 2)
  );*/
  const [counter, setCounter] = useState(globalCounter);

  if (counter & 1)
    adhocEffect(function thePushEffect() {
      const id = counter;
      console.log("In adhocEffect!", id);
      return function thePushCleanup() {
        console.log("In adhocEffect cleanup!", id);
      };
    }, myIdSymbol);

  //console.log("before useEffect():", TSON.stringify(fiberNode, null, 2));
  useEffect(function theCounterEffect() {
    function count() {
      ++globalCounter;
      const fn = fiberNode;
      //debugger;
      setCounter(globalCounter);
    }
    const h = setInterval(count, 1000);
    return function theCounterCleanup() {
      clearInterval(h);
    };
  }, []);

  //console.log("before useEffect2():", TSON.stringify(fiberNode, null, 2));
  useEffect(function theSecondEffect() {
    console.log("in theSecondEffect");
    return function theSecondEffectCleanup() {
      console.log("in theSecondEffectCleanup");
    };
  });

  //console.log("after all hooks:", TSON.stringify(fiberNode, null, 2));

  return <div>Counter: {counter}</div>;
}

export function AnarchyParent() {
  const [state, setState] = useState(1);
  adhocEffect(() => {
    setTimeout(() => setState(0), 3000);
  });

  return state ? <Anarchist /> : <div>Done</div>;
}
