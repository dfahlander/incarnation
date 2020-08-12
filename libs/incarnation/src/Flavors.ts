export interface Flavors<TOrig, TSuspense, TPromise> {
  orig: TOrig;
  suspense?: TSuspense;
  promise?: TPromise;
}
