import { Provider, deriveContext, resolveProvider, Context } from "incarnation";
import React, { ReactNode, useContext } from "react";
import { IncarnationReactContext } from "./IncarnationReactContext";
import { rewriteTree } from "./rewriteTree";
import { readContext } from "./readContext";

// Integrate Incarnation Context with React Context:
Context.integrate((fallbackGetter) => () =>
  readContext(IncarnationReactContext) || fallbackGetter()
);

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
  children: ReactNode;
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
  return <>{children}</>;
}

interface ObserveProps {
  children: ReactNode;
}

export function Observe({ children }: ObserveProps) {
  return rewriteTree(children);
}

export interface CacheManagerProps {
  timeout?: number;
  children: ReactNode;
}
