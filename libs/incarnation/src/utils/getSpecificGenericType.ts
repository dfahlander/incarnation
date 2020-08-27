import { refDeterministic } from "./refDeterministic.js";
import { AbstractClass, Class } from "../Class.js";
import { INNERCLASS } from "../symbols/INNERCLASS.js";

export const getSpecificGenericType = refDeterministic(
  (GenericType: AbstractClass, InnerType: AbstractClass) =>
    class extends (GenericType as any) {
      static [INNERCLASS] = InnerType;
    }
);
