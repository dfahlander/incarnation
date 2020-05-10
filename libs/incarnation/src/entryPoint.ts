import { Class, AbstractClass } from "./Class";
import { Promisified } from "./Promisified";
import { Context } from "./Context";
import { promisify } from "./promisifier";
import { getWrappedProps } from "./utils/getWrappedProps";
import { BoundContext } from "./symbols/BoundContext";
import { getOrCreateBoundInstance } from "./utils/getOrCreateBoundInstance";

export function entryPoint<T extends object>(
  Class: AbstractClass<T>
): T & { [BoundContext]: Context } {
  return entryPointInternal(Class);
}

export function asyncEntryPoint<T extends object>(
  Class: Class<T>
): Promisified<T> & { [BoundContext]: Context } {
  return entryPointInternal(Class, true);
}

const nullTarget = {};
Object.freeze(nullTarget);

function entryPointInternal(Class: AbstractClass<any>, asyncify?: boolean) {
  if (Context.current !== Context.root)
    throw new Error(
      `entryPoint() can only be used in global context. Use async() or use() instead from context based code`
    );
  let boundCtx = Context.generic; // Cannot use Context.root because then use and async() will fail!
  let physicalInstance: any = null;

  // Forwarding proxy that creates physical instance on arbritary access
  const proxy = new Proxy(nullTarget, {
    get(_, prop) {
      return getPhysicalInstance()[prop];
    },
    ownKeys() {
      return Reflect.ownKeys(getPhysicalInstance());
    },
    has(_, key: string | number | symbol) {
      return Reflect.has(getPhysicalInstance(), key);
    },
    getOwnPropertyDescriptor(_, prop) {
      return Reflect.getOwnPropertyDescriptor(getPhysicalInstance(), prop);
    },
    getPrototypeOf() {
      return Reflect.getPrototypeOf(getPhysicalInstance());
    },
  });

  // A final layer that makes it configrable using provide():
  return Object.create(proxy, {
    [BoundContext]: {
      get: () => boundCtx,
      set: (value) => {
        boundCtx = value;
        physicalInstance = null;
      },
    },
  });

  function getPhysicalInstance() {
    if (!physicalInstance) {
      const instance = getOrCreateBoundInstance(boundCtx, Class);
      if (asyncify) {
        let asyncified = instance["$async"];
        if (!asyncified) {
          asyncified = promisify(instance);
          instance["$async"] = asyncified;
        }
        physicalInstance = asyncified;
      } else {
        physicalInstance = instance;
      }
    }
    return physicalInstance;
  }
}
