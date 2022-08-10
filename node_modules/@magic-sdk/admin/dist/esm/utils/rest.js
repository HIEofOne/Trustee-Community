import { createServiceError } from '../core/sdk-exceptions';
import { fetch } from './fetch';
/**
 * Performs a `fetch` to the given URL with the configured `init` object.
 */
async function emitRequest(url, init) {
    const json = await fetch(url, init)
        .then(res => res.json())
        .catch(err => {
        throw createServiceError(err);
    });
    if (json.status !== 'ok') {
        throw createServiceError(json);
    }
    return json.data ?? {};
}
/**
 * Generates an encoded URL with query string from a dictionary of values.
 */
function generateQuery(url, params) {
    let query = '?';
    if (params) {
        for (const [key, value] of Object.entries(params))
            query += `${key}=${value}&`;
        query = query.slice(0, -1); // Remove trailing "&"
    }
    return params ? `${url}${query}` : url;
}
/**
 * POSTs to Magic's API.
 */
export function post(url, secretApiKey, body) {
    return emitRequest(url, {
        method: 'POST',
        headers: { 'X-Magic-Secret-key': secretApiKey },
        body: JSON.stringify(body),
    });
}
/**
 * GETs from Magic's API.
 */
export function get(url, secretApiKey, params) {
    const urlWithParams = generateQuery(url, params);
    return emitRequest(urlWithParams, {
        method: 'GET',
        headers: { 'X-Magic-Secret-key': secretApiKey },
    });
}
//# sourceMappingURL=rest.js.map