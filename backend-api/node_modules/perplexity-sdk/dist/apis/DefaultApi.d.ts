import { BaseAPIRequestFactory } from './baseapi';
import { Configuration } from '../configuration';
import { RequestContext, ResponseContext, HttpInfo } from '../http/http';
import { ChatCompletionResponse } from '../models/ChatCompletionResponse';
import { ChatCompletionsPostRequest } from '../models/ChatCompletionsPostRequest';
export declare class DefaultApiRequestFactory extends BaseAPIRequestFactory {
    chatCompletionsPost(chatCompletionsPostRequest?: ChatCompletionsPostRequest, _options?: Configuration): Promise<RequestContext>;
}
export declare class DefaultApiResponseProcessor {
    chatCompletionsPostWithHttpInfo(response: ResponseContext): Promise<HttpInfo<ChatCompletionResponse>>;
}
