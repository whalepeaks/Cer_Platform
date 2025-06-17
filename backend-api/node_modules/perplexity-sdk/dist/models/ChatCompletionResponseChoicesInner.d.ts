import { ChatCompletionResponseChoicesInnerDelta } from '../models/ChatCompletionResponseChoicesInnerDelta';
import { ChatCompletionsPostRequestMessagesInner } from '../models/ChatCompletionsPostRequestMessagesInner';
export declare class ChatCompletionResponseChoicesInner {
    'index'?: number;
    'finishReason'?: ChatCompletionResponseChoicesInnerFinishReasonEnum;
    'message'?: ChatCompletionsPostRequestMessagesInner;
    'delta'?: ChatCompletionResponseChoicesInnerDelta;
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
export declare enum ChatCompletionResponseChoicesInnerFinishReasonEnum {
    Stop = "stop",
    Length = "length"
}
