import { PromiseDefaultApi as DefaultApi } from './types/PromiseAPI';
interface IConfig {
    apiKey: string;
}
export default class Perplexity {
    private instance;
    constructor(config: IConfig);
    client(): DefaultApi;
}
export * from "./http/http";
export * from "./auth/auth";
export * from "./models/all";
export { createConfiguration } from "./configuration";
export { Configuration } from "./configuration";
export * from "./apis/exception";
export * from "./servers";
export { RequiredError } from "./apis/baseapi";
export { PromiseMiddleware as Middleware } from './middleware';
export { PromiseDefaultApi as DefaultApi } from './types/PromiseAPI';
