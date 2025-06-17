"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatCompletionResponseObjectEnum = exports.ChatCompletionResponse = void 0;
var ChatCompletionResponse = (function () {
    function ChatCompletionResponse() {
    }
    ChatCompletionResponse.getAttributeTypeMap = function () {
        return ChatCompletionResponse.attributeTypeMap;
    };
    ChatCompletionResponse.discriminator = undefined;
    ChatCompletionResponse.attributeTypeMap = [
        {
            "name": "id",
            "baseName": "id",
            "type": "string",
            "format": ""
        },
        {
            "name": "model",
            "baseName": "model",
            "type": "string",
            "format": ""
        },
        {
            "name": "object",
            "baseName": "object",
            "type": "ChatCompletionResponseObjectEnum",
            "format": ""
        },
        {
            "name": "created",
            "baseName": "created",
            "type": "number",
            "format": ""
        },
        {
            "name": "choices",
            "baseName": "choices",
            "type": "Array<ChatCompletionResponseChoicesInner>",
            "format": ""
        },
        {
            "name": "usage",
            "baseName": "usage",
            "type": "ChatCompletionResponseUsage",
            "format": ""
        }
    ];
    return ChatCompletionResponse;
}());
exports.ChatCompletionResponse = ChatCompletionResponse;
var ChatCompletionResponseObjectEnum;
(function (ChatCompletionResponseObjectEnum) {
    ChatCompletionResponseObjectEnum["ChatCompletion"] = "chat.completion";
})(ChatCompletionResponseObjectEnum = exports.ChatCompletionResponseObjectEnum || (exports.ChatCompletionResponseObjectEnum = {}));
//# sourceMappingURL=ChatCompletionResponse.js.map