export type Class<I = any> = new (...args: any[]) => I;
export type AbstractClass<I> = Class<I> | Function;
