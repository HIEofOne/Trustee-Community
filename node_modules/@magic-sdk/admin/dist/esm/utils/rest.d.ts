/**
 * POSTs to Magic's API.
 */
export declare function post<TBody extends Record<string, string | number | boolean> = {}, TResponse extends any = {}>(url: string, secretApiKey: string, body: TBody): Promise<Partial<TResponse>>;
/**
 * GETs from Magic's API.
 */
export declare function get<TResponse extends any = {}>(url: string, secretApiKey: string, params?: any): Promise<Partial<TResponse>>;
