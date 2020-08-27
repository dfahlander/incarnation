import { Context, deriveContext } from "./Context.js";
import { PROVIDER } from "./symbols/PROVIDER.js";
import { Provider, resolveProvider, ProviderFn } from "./Provider.js";

export class Environment {
  get [PROVIDER](): ProviderFn {
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
