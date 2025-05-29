"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatCompletionsPostRequestModelEnum = exports.ChatCompletionsPostRequest = void 0;
var ChatCompletionsPostRequest = (function () {
    function ChatCompletionsPostRequest() {
    }
    ChatCompletionsPostRequest.getAttributeTypeMap = function () {
        return ChatCompletionsPostRequest.attributeTypeMap;
    };
    ChatCompletionsPostRequest.discriminator = undefined;
    ChatCompletionsPostRequest.attributeTypeMap = [
        {
            "name": "model",
            "baseName": "model",
            "type": "ChatCompletionsPostRequestModelEnum",
            "format": ""
        },
        {
            "name": "messages",
            "baseName": "messages",
            "type": "Array<ChatCompletionsPostRequestMessagesInner>",
            "format": ""
        },
        {
            "name": "maxTokens",
            "baseName": "max_tokens",
            "type": "number",
            "format": ""
        },
        {
            "name": "temperature",
            "baseName": "temperature",
            "type": "number",
            "format": ""
        },
        {
            "name": "topP",
            "baseName": "top_p",
            "type": "number",
            "format": ""
        },
        {
            "name": "topK",
            "baseName": "top_k",
            "type": "number",
            "format": ""
        },
        {
            "name": "stream",
            "baseName": "stream",
            "type": "boolean",
            "format": ""
        },
        {
            "name": "presencePenalty",
            "baseName": "presence_penalty",
            "type": "number",
            "format": ""
        },
        {
            "name": "frequencyPenalty",
            "baseName": "frequency_penalty",
            "type": "number",
            "format": ""
        }
    ];
    return ChatCompletionsPostRequest;
}());
exports.ChatCompletionsPostRequest = ChatCompletionsPostRequest;
var ChatCompletionsPostRequestModelEnum;
(function (ChatCompletionsPostRequestModelEnum) {
    ChatCompletionsPostRequestModelEnum["Pplx7bChat"] = "pplx-7b-chat";
    ChatCompletionsPostRequestModelEnum["Pplx70bChat"] = "pplx-70b-chat";
    ChatCompletionsPostRequestModelEnum["Pplx7bOnline"] = "pplx-7b-online";
    ChatCompletionsPostRequestModelEnum["Pplx70bOnline"] = "pplx-70b-online";
    ChatCompletionsPostRequestModelEnum["Llama270bChat"] = "llama-2-70b-chat";
    ChatCompletionsPostRequestModelEnum["Codellama34bInstruct"] = "codellama-34b-instruct";
    ChatCompletionsPostRequestModelEnum["Codellama70bInstruct"] = "codellama-70b-instruct";
    ChatCompletionsPostRequestModelEnum["Mistral7bInstruct"] = "mistral-7b-instruct";
    ChatCompletionsPostRequestModelEnum["Mixtral8x7bInstruct"] = "mixtral-8x7b-instruct";
})(ChatCompletionsPostRequestModelEnum = exports.ChatCompletionsPostRequestModelEnum || (exports.ChatCompletionsPostRequestModelEnum = {}));
//# sourceMappingURL=ChatCompletionsPostRequest.js.map