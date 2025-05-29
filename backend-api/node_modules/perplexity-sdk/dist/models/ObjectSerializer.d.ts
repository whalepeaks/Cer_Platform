export * from '../models/ChatCompletionResponse';
export * from '../models/ChatCompletionResponseChoicesInner';
export * from '../models/ChatCompletionResponseChoicesInnerDelta';
export * from '../models/ChatCompletionResponseUsage';
export * from '../models/ChatCompletionsPostRequest';
export * from '../models/ChatCompletionsPostRequestMessagesInner';
export * from '../models/ErrorResponse';
export * from '../models/ErrorResponseError';
export declare class ObjectSerializer {
    static findCorrectType(data: any, expectedType: string): any;
    static serialize(data: any, type: string, format: string): any;
    static deserialize(data: any, type: string, format: string): any;
    static normalizeMediaType(mediaType: string | undefined): string | undefined;
    static getPreferredMediaType(mediaTypes: Array<string>): string;
    static stringify(data: any, mediaType: string): string;
    static parse(rawData: string, mediaType: string | undefined): any;
}
