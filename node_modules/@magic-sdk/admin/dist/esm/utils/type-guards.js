/*
  This file contains our type guards.

  Type guards are a feature of TypeScript which narrow the type signature of
  intesection types (types that can be one thing or another).

  @see
  https://www.typescriptlang.org/docs/handbook/advanced-types.html#type-guards-and-differentiating-types
 */
/** Assert `value` is `undefined`. */
function isUndefined(value) {
    return typeof value === 'undefined';
}
/** Assert `value` is `null`. */
function isNull(value) {
    return value === null;
}
/** Assert `value` is `null` or `undefined`. */
function isNil(value) {
    return isNull(value) || isUndefined(value);
}
/** Assert `value` contains all required DID Token members. */
export function isDIDTClaim(value) {
    return (!isNil(value) &&
        !isNil(value.iat) &&
        !isNil(value.ext) &&
        !isNil(value.iss) &&
        !isNil(value.sub) &&
        !isNil(value.aud) &&
        !isNil(value.nbf) &&
        !isNil(value.tid) &&
        !isNil(value.add));
}
//# sourceMappingURL=type-guards.js.map