import { HttpInfo } from '../http/http';
import { Configuration } from '../configuration';
import { Observable } from '../rxjsStub';
import { ChatCompletionResponse } from '../models/ChatCompletionResponse';
import { ChatCompletionsPostRequest } from '../models/ChatCompletionsPostRequest';
import { DefaultApiRequestFactory, DefaultApiResponseProcessor } from "../apis/DefaultApi";
export declare class ObservableDefaultApi {
    private requestFactory;
    private responseProcessor;
    private configuration;
    constructor(configuration: Configuration, requestFactory?: DefaultApiRequestFactory, responseProcessor?: DefaultApiResponseProcessor);
    chatCompletionsPostWithHttpInfo(chatCompletionsPostRequest?: ChatCompletionsPostRequest, _options?: Configuration): Observable<HttpInfo<ChatCompletionResponse>>;
    chatCompletionsPost(chatCompletionsPostRequest?: ChatCompletionsPostRequest, _options?: Configuration): Observable<ChatCompletionResponse>;
}
