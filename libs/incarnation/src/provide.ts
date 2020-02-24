import { ContextMiddleware } from "./Context";
import { providedContextMiddlewares } from "./inject";
import { ProvideTarget } from "./ProvideTarget";

export function provide(instance: object) {
  while (instance[ProvideTarget]) instance = instance[ProvideTarget];
  return {
    with(provider: ContextMiddleware) {
      // TODO: Also accept Middlewares (class Middlewares etc)
      providedContextMiddlewares.set(instance, provider);
    }
  };
}
