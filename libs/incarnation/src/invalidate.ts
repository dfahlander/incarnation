export function invalidate<T>(result: T): T {
  invalidate.invalid = true;
  return result;
}
invalidate.invalid = false;
