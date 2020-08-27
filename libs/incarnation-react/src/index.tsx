import { Provider, deriveContext, resolveProvider, Context } from "incarnation";
import React, { ReactNode, useContext, ReactElement } from "react";
import { IncarnationReactContext } from "./IncarnationReactContext.js";
import { rewriteTree } from "./rewriteTree.js";
import { readContext } from "./readContext.js";

// Integrate Incarnation Context with React Context:
/*Context.integrate((fallbackGetter) => () => {
  let res;
  try {
    res = readContext(IncarnationReactContext);
    console.debug("Got context from React!");
    debugger;
  } catch {}
  return res || fallbackGetter();
});*/

// <FriendList /> ==>
//    render + iteration + toArray() etc leads to Exception: Query called outside Observe context.
//    onClick={()=>db.friends.toArray()} leads to Exception: Query called outside Observe context.
// import { ...anything } from "incarnation-react";
//    <FriendList /> ==> Exception: Missing <Observe />
//    onClick={()=>db.friends.toArray()} ==> Exception: Query called outside Observe context.
//    onClick={()=>myService.getSomething()} ==> returns undefined. Deferred Exception: Query called outside Observe context.
// <Observe><FriendList /></Observe> ==> iteration works, toArray() works.

export interface IncarnationProps {
  provider: Provider;
  children: ReactElement;
}

export function Incarnation({ children, provider }: IncarnationProps) {
  const parentCtx = useContext(IncarnationReactContext);
  if (provider) {
    const providerFn = resolveProvider(provider);
    return (
      <IncarnationReactContext.Provider
        value={deriveContext(parentCtx, providerFn)}
      >
        {children}
      </IncarnationReactContext.Provider>
    );
  }
  return children;
}

interface ObserveProps {
  children: ReactElement;
}

export function Observe({ children }: ObserveProps): ReactElement {
  const result = rewriteTree(children);
  if (result && typeof result === "object" && "type" in result) {
    return result;
  }
  return <>{result}</>;
}

export interface CacheManagerProps {
  timeout?: number;
  children: ReactNode;
}
