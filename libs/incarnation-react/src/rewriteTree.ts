import React, {
  ReactNode,
  ReactElement,
  Component,
  useState,
  useEffect,
} from "react";
import {
  refDeterministic,
  CurrentExecution,
  Execution,
  CircularLinkedSubscriber,
} from "incarnation";
import { IncarnationReactContext } from "./IncarnationReactContext";

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
      return getRewrittenClassComponent(c as { new (): React.Component }); // for now.
    } else {
      // Function component
      return incarnated(c as (props: any) => ReactElement);
    }
  }
);

function incarnated(FuncComponent: (props: any) => any) {
  const rv = function (props: any) {
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
      const result = FuncComponent(props);
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
>(ClassComponent: T): T & { $$incarnated?: boolean } {
  const rv = class extends ClassComponent {
    static $$incarnated = true;
    // @ts-ignore
    static get name() {
      return ClassComponent.name;
    }
    $$lastExecution: Execution;
    $$lastNodes: CircularLinkedSubscriber[] | null = null;
    $$notify() {
      this.setState((state) => ({ $$counter: (state.$$counter || 0) + 1 }));
    }
    render(...args: any[]) {
      const parentExecution = CurrentExecution.current;
      if (this.$$lastNodes) {
        this.$$lastNodes.forEach((node) => node.topic.unsubscribe(node));
        this.$$lastNodes = [];
      }
      this.$$lastExecution = { topics: [] };
      CurrentExecution.current = this.$$lastExecution;
      try {
        // @ts-ignore
        const result = super.render(...args);
        const rewritten = rewriteTree(result);
        if (this.$$lastNodes) {
          // Alread mounted. Start immediately subscribing to the new observables:
          const notify = this.$$notify.bind(this);
          this.$$lastNodes = this.$$lastExecution.topics.map((topic) =>
            topic.subscribe(notify)
          );
        }
        return rewritten;
      } finally {
        CurrentExecution.current = parentExecution;
      }
    }
    componentDidMount() {
      const notify = this.$$notify.bind(this);
      if (this.$$lastExecution)
        this.$$lastNodes = this.$$lastExecution.topics.map((topic) =>
          topic.subscribe(notify)
        );
      if (super.componentDidMount)
        super.componentDidMount.call(this, arguments);
    }
    componentWillUnmount() {
      if (super.componentWillUnmount)
        super.componentWillUnmount.call(this, arguments);
      if (this.$$lastNodes) {
        this.$$lastNodes.forEach((node) => node.topic.unsubscribe(node));
        this.$$lastNodes = [];
      }
    }
  };
  return rv;
}

/*function incarnatedClass(ClassComponent: { new (): Component }) {
  const rv = getRewrittenClassComponent(ClassComponent);
  rv.$$incarnated = true;
  return rv;
}
*/
