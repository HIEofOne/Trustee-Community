/* istanbul ignore next */
export const fetch = !globalThis.fetch
    ? (url, init) => import('node-fetch').then(({ default: f }) => f(url, init))
    : globalThis.fetch;
//# sourceMappingURL=fetch.js.map