import { ChatCompletionResponseChoicesInner } from '../models/ChatCompletionResponseChoicesInner';
import { ChatCompletionResponseUsage } from '../models/ChatCompletionResponseUsage';
export declare class ChatCompletionResponse {
    'id'?: string;
    'model'?: string;
    'object'?: ChatCompletionResponseObjectEnum;
    'created'?: number;
    'choices'?: Array<ChatCompletionResponseChoicesInner>;
    'usage'?: ChatCompletionResponseUsage;
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
export declare enum ChatCompletionResponseObjectEnum {
    ChatCompletion = "chat.completion"
}
