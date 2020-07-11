import { Provider, deriveContext, resolveProvider } from "incarnation";
import React, { ReactNode, useContext } from "react";
import { IncarnationContext } from "./IncarnationContext";
import { rewriteTree } from "./rewriteTree";

/*
TODO:
  1. Create exported function Incarnation that:
     A: Allows adding providers
     B: recursively rewrite children with a middle-component that...
*/
export interface IncarnationProps {
  provider?: Provider;
  children: ReactNode;
}

export function Incarnation({ children, provider }: IncarnationProps) {
  const parentCtx = useContext(IncarnationContext);
  let result = rewriteTree(children);
  if (provider) {
    const providerFn = resolveProvider(provider);
    return (
      <IncarnationContext.Provider value={deriveContext(parentCtx, providerFn)}>
        {result}
      </IncarnationContext.Provider>
    );
  } else {
    return result;
  }
}
