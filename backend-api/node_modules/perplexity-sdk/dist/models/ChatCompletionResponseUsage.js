"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatCompletionResponseUsage = void 0;
var ChatCompletionResponseUsage = (function () {
    function ChatCompletionResponseUsage() {
    }
    ChatCompletionResponseUsage.getAttributeTypeMap = function () {
        return ChatCompletionResponseUsage.attributeTypeMap;
    };
    ChatCompletionResponseUsage.discriminator = undefined;
    ChatCompletionResponseUsage.attributeTypeMap = [
        {
            "name": "promptTokens",
            "baseName": "prompt_tokens",
            "type": "number",
            "format": ""
        },
        {
            "name": "completionTokens",
            "baseName": "completion_tokens",
            "type": "number",
            "format": ""
        },
        {
            "name": "totalTokens",
            "baseName": "total_tokens",
            "type": "number",
            "format": ""
        }
    ];
    return ChatCompletionResponseUsage;
}());
exports.ChatCompletionResponseUsage = ChatCompletionResponseUsage;
//# sourceMappingURL=ChatCompletionResponseUsage.js.map