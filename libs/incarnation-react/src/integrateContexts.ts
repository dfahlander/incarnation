import { Context } from "incarnation";
import { IncarnationReactContext } from "./IncarnationReactContext.js";

export function integrateContexts() {
  Context.integrate((next) => {
    const reactCtx = (IncarnationReactContext as any)._currentValue;
    return reactCtx === Context.base ? next() : reactCtx;
  });
}
/*
  Koden används ännu inte.
  Idén är att en react komponent utanför <Observe> ändå ska fungera men som statisk cachande resultat.
  Då måste react-incarnation ha importerats. Annars går det ju inte alls. Eller?
  Jo, om vi kan låta Context.root gälla. Och cacha saker globalt. Så ... jo.
*/
