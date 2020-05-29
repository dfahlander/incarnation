import { Topic } from "./Topic";
import { ActiveQuery } from "./ActiveQuery";

export interface Execution {
  queries: ActiveQuery[];
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
