type Constructor = new (...args: any[]) => object;
type NoArgumentConstructor = new () => object;

type UnionToIntersection<T> = (T extends unknown ? (value: T) => void : never) extends (
  value: infer Intersection,
) => void
  ? Intersection
  : never;

/**
 * Creates a class that extends the first constructor and composes additional
 * no-argument classes into its instance state and prototype. Later mixins
 * override earlier members with the same name.
 */
export function mixins<TBase extends Constructor, TMixins extends readonly NoArgumentConstructor[]>(
  Base: TBase,
  ...mixins: TMixins
): new (
  ...args: ConstructorParameters<TBase>
) => InstanceType<TBase> & UnionToIntersection<InstanceType<TMixins[number]>> {
  const Combined = class extends Base {
    constructor(...args: any[]) {
      super(...args);

      for (const Mixin of mixins) {
        Object.assign(this, new Mixin());
      }
    }
  };

  for (const Mixin of mixins) {
    for (const key of Reflect.ownKeys(Mixin.prototype)) {
      if (key === "constructor") {
        continue;
      }

      const descriptor = Object.getOwnPropertyDescriptor(Mixin.prototype, key);

      if (descriptor) {
        Object.defineProperty(Combined.prototype, key, descriptor);
      }
    }
  }

  return Combined as unknown as new (
    ...args: ConstructorParameters<TBase>
  ) => InstanceType<TBase> & UnionToIntersection<InstanceType<TMixins[number]>>;
}
