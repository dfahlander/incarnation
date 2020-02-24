import React from "react";

export interface ReactSharedInternals {
  ReactCurrentDispatcher: { current: ReactCurrentDispatcher };
  ReactCurrentOwner: { current: FiberNode };
  IsSomeRendererActing: { current: boolean };
  assign: typeof Object.assign;
}

export interface ReactCurrentDispatcher {
  readContext(ctx: any, observedBits?: number): any;
  useCallback: typeof React.useCallback;
  useContext: typeof React.useContext;
  useEffect: typeof React.useEffect;
  useImperativeHandle: typeof React.useImperativeHandle;
  useLayoutEffect: typeof React.useLayoutEffect;
  useMemo: typeof React.useMemo;
  useReducer: typeof React.useReducer;
  useRef: typeof React.useRef;
  useState: typeof React.useState;
  useDebugValue: typeof React.useDebugValue;
  useResponder: Function;
  useDeferredValue: Function;
  useTransition: Function;
}

export interface FiberNode {
  tag: number;
  key: any;
  elementType: any; // The function itself if functional component.
  type: any; // The function itself if functional component.
  stateNode: any;
  return: FiberNode | null;
  child: FiberNode | null;
  sibling: FiberNode | null;
  index: number;
  ref: any;
  pendingProps: Object;
  memoizedProps: any;
  updateQueue: any;
  memoizedState: any;
  dependencies: any;
  mode: number;
  effectTag: number;
  nextEffect: any;
  firstEffect: any;
  lastEffect: any;
  expirationTime: number;
  childExpirationTime: number;
  alternate: null | FiberNode;
  actualDuration: number;
  actualStartTime: number;
  selfBaseDuration: number;
  treeBaseDuration: number;
}

export const ReactSharedInternals: ReactSharedInternals = Object.keys(React)
  .filter(key => key.includes("_INTERNALS"))
  .map(k => React[k])[0];
