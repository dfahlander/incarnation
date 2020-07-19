//import React from "react";
import { ReactSharedInternals } from "./ReactSharedInternals";
//import ReactDOMServer from "react-dom/server";
const { ReactCurrentDispatcher } = ReactSharedInternals;

/*let realReadContext: any = null;

ReactDOMServer.renderToStaticMarkup(<Test />);
function Test() {
  const { current } = ReactCurrentDispatcher;
  if (!current) throw new Error("Internal Error!");
  realReadContext = current.readContext;
  return <span />;
}
*/
export function readContext(ctx: any): any {
  const { current } = ReactCurrentDispatcher;
  return current ? current.readContext(ctx) : null;
}
