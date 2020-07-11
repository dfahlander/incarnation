import React, {
  ReactNode,
  createContext,
  useContext,
  ReactElement,
  Component,
  useState,
  useEffect,
} from "react";
import {
  refDeterministic,
  runInContext,
  Context,
  CurrentExecution,
  Execution,
  CircularLinkedSubscriber,
} from "incarnation";
import { IncarnationContext } from "./IncarnationContext";

export function rewriteTree(node: ReactNode): ReactNode {
  if (!node) return node;
  if (Array.isArray(node)) node.map(rewriteTree);
  if (typeof node !== "object") return node;
  if ("type" in node) {
    let children = node.props?.children;
    let changed = false;
    let type = node.type;
    if (children) {
      children = rewriteTree(children);
      changed = true;
    }

    if (typeof type === "function") {
      // @ts-ignore
      type = getMemoizedProxyComponent(type);
      if (type !== node.type) changed = true;
    }
    return changed
      ? children
        ? { ...node, children, type }
        : { ...node, type }
      : node;
  }
}

const getMemoizedProxyComponent = refDeterministic(
  (c: Function & { $$incarnated?: boolean }) => {
    if (c.$$incarnated) return c;
    if (c.prototype && "isReactComponent" in c.prototype) {
      // Class component
      return incarnatedClass(c as { new (): React.Component }); // for now.
    } else {
      // Function component
      return incarnated(c as (props: any) => ReactElement);
    }
  }
);

function incarnated(FuncComponent: (props: any) => any) {
  const rv = function (props: any) {
    const ctx = useContext(IncarnationContext);
    const [count, setCount] = useState(1);
    const parentExecution = CurrentExecution.current;
    const execution: Execution = { topics: [] };
    CurrentExecution.current = execution;
    function notify() {
      setCount((count) => count + 1);
    }
    useEffect(() => {
      const nodes = execution.topics.map((topic) => topic.subscribe(notify));
      return () => nodes.forEach((node) => node.topic.unsubscribe(node));
    });
    try {
      const result = runInContext(FuncComponent, ctx, props);
      return rewriteTree(result);
    } finally {
      CurrentExecution.current = parentExecution;
    }
  };
  rv.$$incarnated = true;
  Object.defineProperty(rv, "name", {
    get() {
      return FuncComponent.name;
    },
  });
  return rv;
}

const getRewrittenClassComponent = refDeterministic(
  _getRewrittenClassComponent
);

function _getRewrittenClassComponent<
  T extends { new (...args: any[]): Component<any, any>; readonly name: string }
>(ClassComponent: T, ctx: Context): T {
  return class extends ClassComponent {
    // @ts-ignore
    static get name() {
      return ClassComponent.name;
    }
    $$execution: Execution;
    $$nodes: CircularLinkedSubscriber[];
    $$notify() {
      this.setState((state) => ({ $$counter: (state.$$counter || 0) + 1 }));
    }
    render(...args: any[]) {
      const parentExecution = CurrentExecution.current;
      if (this.$$nodes) {
        this.$$nodes.forEach((node) => node.topic.unsubscribe(node));
        this.$$nodes = [];
      }
      this.$$execution = { topics: [] };
      CurrentExecution.current = this.$$execution;
      const result = runInContext.call(this, super.render, ctx, ...args);
      return rewriteTree(result);
    }
    componentDidMount() {
      const notify = this.$$notify.bind(this);
      if (this.$$execution)
        this.$$nodes = this.$$execution.topics.map((topic) =>
          topic.subscribe(notify)
        );
      if (super.componentDidMount)
        super.componentDidMount.call(this, arguments);
    }
    componentWillUnmount() {
      if (super.componentWillUnmount)
        super.componentWillUnmount.call(this, arguments);
      if (this.$$nodes) {
        this.$$nodes.forEach((node) => node.topic.unsubscribe(node));
        this.$$nodes = [];
      }
    }
  };
}

function incarnatedClass(ClassComponent: { new (): Component }) {
  const rv = function Incarnated(props: any) {
    const ctx = useContext(IncarnationContext);
    const C = getRewrittenClassComponent(ClassComponent, ctx);
    return <C {...props} />;
  };
  rv.$$incarnated = true;
  return rv;
}
