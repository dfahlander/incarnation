import { refDeterministic } from "./refDeterministic";
import { AbstractClass, Class } from "../Class";
import { INNERCLASS } from "../symbols/INNERCLASS";

export const getSpecificGenericType = refDeterministic(
  (GenericType: AbstractClass, InnerType: AbstractClass) =>
    class extends (GenericType as any) {
      static [INNERCLASS] = InnerType;
    }
);
