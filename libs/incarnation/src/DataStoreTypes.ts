import { Topic } from "./Topic";

export type Mutation = { type: string };

export interface MutationQueue {
  queued: Mutation[];
  beingSent: Mutation[];
  topic: Topic;
  rev: number;
}

export type ResultReducer<T = any> = (prevResult: T, op: Mutation) => T;

export type ResultReducerSet = {
  [mutationType: string]: ResultReducer;
};

export type GetResultReducers = (...args: any[]) => ResultReducerSet;
