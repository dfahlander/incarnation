import { Topic } from "./Topic";

export interface Execution {
  topics: Topic[];
}

export const _CurrentExecution = {
  current: null as Execution | null,
};

export type CurrentExecution = typeof _CurrentExecution;

if (!globalThis._incarnationExecution) {
  globalThis._incarnationExecution = _CurrentExecution;
}

export const CurrentExecution = globalThis._incarnationExecution as CurrentExecution;

// TODO:
// 1.
