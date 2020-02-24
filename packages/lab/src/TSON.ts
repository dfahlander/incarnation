import Typeson from "typeson";
import commonTypeson from "typeson-registry/presets/builtin";

const farr: Function[] = [];

export const TSON = new Typeson().register([
  commonTypeson,
  {
    Function: [
      (x: any) => typeof x === "function",
      (f: Function) => {
        const pos = farr.length;
        farr.push(f);
        return f.name ? `function ${f.name}(${pos}){...}` : `(${pos})=>{...}`;
      },
      (fn: string) => {
        const pParen = fn.indexOf("(");
        const pEndParen = fn.indexOf(")");
        const pos = parseInt(fn.substring(pParen + 1, pEndParen));
        return farr[pos];
      }
    ]
  }
]);
