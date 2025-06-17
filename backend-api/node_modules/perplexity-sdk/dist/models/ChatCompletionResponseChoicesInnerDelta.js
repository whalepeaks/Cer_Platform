"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatCompletionResponseChoicesInnerDelta = void 0;
var ChatCompletionResponseChoicesInnerDelta = (function () {
    function ChatCompletionResponseChoicesInnerDelta() {
    }
    ChatCompletionResponseChoicesInnerDelta.getAttributeTypeMap = function () {
        return ChatCompletionResponseChoicesInnerDelta.attributeTypeMap;
    };
    ChatCompletionResponseChoicesInnerDelta.discriminator = undefined;
    ChatCompletionResponseChoicesInnerDelta.attributeTypeMap = [
        {
            "name": "content",
            "baseName": "content",
            "type": "string",
            "format": ""
        },
        {
            "name": "role",
            "baseName": "role",
            "type": "string",
            "format": ""
        }
    ];
    return ChatCompletionResponseChoicesInnerDelta;
}());
exports.ChatCompletionResponseChoicesInnerDelta = ChatCompletionResponseChoicesInnerDelta;
//# sourceMappingURL=ChatCompletionResponseChoicesInnerDelta.js.map