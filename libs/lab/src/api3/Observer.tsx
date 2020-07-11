import React, { ReactElement } from "react";
import { TSON } from "../TSON";

function getMemoizedProxyComponent(c: Function) {
  if ("isReactComponent" in c) {
    // Class component
  } else {
    // Function component
  }
  return c; // For now!
}

export function Observer({ children }) {
  console.log(children);
  return proxyTree(children) as ReactElement;
}

interface ReactNode {
  type: any;
  key: any;
  ref: any;
  props?: {
    children?: ReactNode;
  };
}

function proxyTree(c: ReactNode): ReactNode {
  let children = c.props?.children;
  let changed = false;
  let type = c.type;
  if (children) {
    children = proxyTree(children);
    changed = true;
  }

  if (typeof type === "function") {
    type = getMemoizedProxyComponent(type);
    changed = true;
  }
  return c; //changed ? { ...c, children, type } : c;
}
