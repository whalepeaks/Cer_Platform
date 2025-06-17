"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatCompletionsPostRequestMessagesInner = void 0;
var ChatCompletionsPostRequestMessagesInner = (function () {
    function ChatCompletionsPostRequestMessagesInner() {
    }
    ChatCompletionsPostRequestMessagesInner.getAttributeTypeMap = function () {
        return ChatCompletionsPostRequestMessagesInner.attributeTypeMap;
    };
    ChatCompletionsPostRequestMessagesInner.discriminator = undefined;
    ChatCompletionsPostRequestMessagesInner.attributeTypeMap = [
        {
            "name": "role",
            "baseName": "role",
            "type": "string",
            "format": ""
        },
        {
            "name": "content",
            "baseName": "content",
            "type": "string",
            "format": ""
        }
    ];
    return ChatCompletionsPostRequestMessagesInner;
}());
exports.ChatCompletionsPostRequestMessagesInner = ChatCompletionsPostRequestMessagesInner;
//# sourceMappingURL=ChatCompletionsPostRequestMessagesInner.js.map