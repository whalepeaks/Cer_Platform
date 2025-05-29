import { HttpInfo } from '../http/http';
import { Configuration } from '../configuration';
import { ChatCompletionResponse } from '../models/ChatCompletionResponse';
import { ChatCompletionsPostRequest } from '../models/ChatCompletionsPostRequest';
import { DefaultApiRequestFactory, DefaultApiResponseProcessor } from "../apis/DefaultApi";
export interface DefaultApiChatCompletionsPostRequest {
    chatCompletionsPostRequest?: ChatCompletionsPostRequest;
}
export declare class ObjectDefaultApi {
    private api;
    constructor(configuration: Configuration, requestFactory?: DefaultApiRequestFactory, responseProcessor?: DefaultApiResponseProcessor);
    chatCompletionsPostWithHttpInfo(param?: DefaultApiChatCompletionsPostRequest, options?: Configuration): Promise<HttpInfo<ChatCompletionResponse>>;
    chatCompletionsPost(param?: DefaultApiChatCompletionsPostRequest, options?: Configuration): Promise<ChatCompletionResponse>;
}
