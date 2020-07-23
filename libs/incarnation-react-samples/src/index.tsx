import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import { Incarnation, Observe } from "incarnation-react";

import { Hello } from "./components/Hello";
import { Environment } from "incarnation";
import {
  KeyValueStoreOptimisticUpdater,
  KeyValueStore,
} from "./stores/KeyValueStore";

const env = new Environment();
env.add(KeyValueStore);
//debugger;
//env.add(KeyValueStore.Config({ sleepTime: 1000 }));
//env.add(KeyValueStoreOptimisticUpdater);
ReactDOM.render(
  <Incarnation provider={env}>
    <Suspense fallback="">
      <Observe>
        <Hello />
      </Observe>
    </Suspense>
  </Incarnation>,
  document.getElementById("example")
);
