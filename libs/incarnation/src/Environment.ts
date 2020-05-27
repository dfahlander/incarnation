import { Context, deriveContext } from "./Context";
import { PROVIDER } from "./symbols/PROVIDER";
import { Provider, resolveProvider, ChainableClassMapper } from "./Provider";

export class Environment {
  get [PROVIDER](): ChainableClassMapper {
    return this.context[PROVIDER];
  }
  context: Context = Context.root;

  providers: Provider[] = [];

  add(...providers: Provider[]) {
    this.providers.push(...providers);
    for (const provider of providers) {
      const providerFn = resolveProvider(provider);
      this.context = deriveContext(this.context, providerFn);
    }
  }

  remove(...providers: Provider[]) {
    this.providers = this.providers.filter((p) => !providers.includes(p));
    this.context = this.providers.reduce<Context>(
      (context: Context, provider: Provider) =>
        deriveContext(context, resolveProvider(provider)),
      Context.root
    );
  }
}
