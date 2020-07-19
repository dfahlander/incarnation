import React from "react";
import { use } from "incarnation";
import { HelloService } from "../services/HelloService";
import { KeyValueStore } from "../stores/KeyValueStore";

export function Hello() {
  const svc = use(HelloService);
  const store = use(KeyValueStore);
  const nm = svc.getName();
  return (
    <div>
      Name: {nm}
      <br />
      Age: {svc.getAge()}
      <br />
      Count: {store.count()}
      <input
        type="text"
        value={svc.getName()}
        onChange={(ev) => {
          //debugger;
          svc.setName(ev.target.value);
        }}
      />
      <button onClick={() => svc.incrementAge()}>+ age</button>
    </div>
  );
}
