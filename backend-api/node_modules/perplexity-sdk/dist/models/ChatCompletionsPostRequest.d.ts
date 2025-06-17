import { ChatCompletionsPostRequestMessagesInner } from '../models/ChatCompletionsPostRequestMessagesInner';
export declare class ChatCompletionsPostRequest {
    'model': ChatCompletionsPostRequestModelEnum;
    'messages': Array<ChatCompletionsPostRequestMessagesInner>;
    'maxTokens'?: number;
    'temperature'?: number;
    'topP'?: number;
    'topK'?: number;
    'stream'?: boolean;
    'presencePenalty'?: number;
    'frequencyPenalty'?: number;
    static readonly discriminator: string | undefined;
    static readonly attributeTypeMap: Array<{
        name: string;
        baseName: string;
        type: string;
        format: string;
    }>;
    static getAttributeTypeMap(): {
        name: string;
        baseName: string;
        type: string;
        format: string;
    }[];
    constructor();
}
export declare enum ChatCompletionsPostRequestModelEnum {
    Pplx7bChat = "pplx-7b-chat",
    Pplx70bChat = "pplx-70b-chat",
    Pplx7bOnline = "pplx-7b-online",
    Pplx70bOnline = "pplx-70b-online",
    Llama270bChat = "llama-2-70b-chat",
    Codellama34bInstruct = "codellama-34b-instruct",
    Codellama70bInstruct = "codellama-70b-instruct",
    Mistral7bInstruct = "mistral-7b-instruct",
    Mixtral8x7bInstruct = "mixtral-8x7b-instruct"
}
