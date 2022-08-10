import { RequestInit, Response } from 'node-fetch';
declare type Fetch = (url: string, init?: RequestInit) => Promise<Response>;
export declare const fetch: Fetch;
export {};
