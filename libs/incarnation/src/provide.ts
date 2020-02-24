import { providedClassMapperMiddleware } from "./inject";
import { ProvideTarget } from "./ProvideTarget";
import { ClassMapperMiddleware } from "./Context";

export function provide(instance: object) {
  while (instance[ProvideTarget]) instance = instance[ProvideTarget];
  return {
    with(provider: ClassMapperMiddleware) {
      // TODO: Also accept Middlewares (class Middlewares etc)
      providedClassMapperMiddleware.set(instance, provider);
    }
  };
}
