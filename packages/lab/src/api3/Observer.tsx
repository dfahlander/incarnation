import React from "react";
import { TSON } from "../TSON";


function getMemoizedProxyComponent(c: Function) {
  if ('isReactComponent' in c) {
    // Class component
  } else {
    // Function component
  }
}

export function Observer({ children }) {
  console.log(children);
  return proxyTree(children);
}

interface ReactNode {
  type: any;
  key: any;
  ref: any;
  props?: {
    children?: ReactNode
  }
}

function proxyTree(c: ReactNode): ReactNode {
  let children =c.props?.children;
  let changed = false;
  let type = c.type;
  if (children) {
    children = proxyTree(children);
    changed = true;
  }

  if (typeof type === "function") {
    type = getMemoizedProxyComponent (c);
    changed = true;
  }
  return changed ? {...c, children, type} : c;
}