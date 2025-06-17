import { HttpInfo } from '../http/http';
import { Configuration } from '../configuration';
import { ChatCompletionResponse } from '../models/ChatCompletionResponse';
import { ChatCompletionsPostRequest } from '../models/ChatCompletionsPostRequest';
import { DefaultApiRequestFactory, DefaultApiResponseProcessor } from "../apis/DefaultApi";
export declare class PromiseDefaultApi {
    private api;
    constructor(configuration: Configuration, requestFactory?: DefaultApiRequestFactory, responseProcessor?: DefaultApiResponseProcessor);
    chatCompletionsPostWithHttpInfo(chatCompletionsPostRequest?: ChatCompletionsPostRequest, _options?: Configuration): Promise<HttpInfo<ChatCompletionResponse>>;
    chatCompletionsPost(chatCompletionsPostRequest?: ChatCompletionsPostRequest, _options?: Configuration): Promise<ChatCompletionResponse>;
}
