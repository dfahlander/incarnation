import { MWFunction, Context, deriveContext } from "./Context";
import { PROVIDER } from "./symbols/PROVIDER";
import { Provider, resolveProvider } from "./Provider";

export class Environment {
  get [PROVIDER](): MWFunction {
    return this.context.mwFunction;
  }
  context: Context = Context.root;

  providers: Provider[] = [];

  addProvider(provider: Provider) {
    this.providers.push(provider);
    const mwFunction = resolveProvider(provider);
    this.context = deriveContext(this.context, mwFunction);
  }

  removeProvider(provider: Provider) {
    this.providers = this.providers.filter((p) => p !== provider);
    this.context = this.providers.reduce(
      (context, provider) => deriveContext(context, resolveProvider(provider)),
      Context.root
    );
  }
}
