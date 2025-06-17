"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatCompletionResponseChoicesInnerFinishReasonEnum = exports.ChatCompletionResponseChoicesInner = void 0;
var ChatCompletionResponseChoicesInner = (function () {
    function ChatCompletionResponseChoicesInner() {
    }
    ChatCompletionResponseChoicesInner.getAttributeTypeMap = function () {
        return ChatCompletionResponseChoicesInner.attributeTypeMap;
    };
    ChatCompletionResponseChoicesInner.discriminator = undefined;
    ChatCompletionResponseChoicesInner.attributeTypeMap = [
        {
            "name": "index",
            "baseName": "index",
            "type": "number",
            "format": ""
        },
        {
            "name": "finishReason",
            "baseName": "finish_reason",
            "type": "ChatCompletionResponseChoicesInnerFinishReasonEnum",
            "format": ""
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "ChatCompletionsPostRequestMessagesInner",
            "format": ""
        },
        {
            "name": "delta",
            "baseName": "delta",
            "type": "ChatCompletionResponseChoicesInnerDelta",
            "format": ""
        }
    ];
    return ChatCompletionResponseChoicesInner;
}());
exports.ChatCompletionResponseChoicesInner = ChatCompletionResponseChoicesInner;
var ChatCompletionResponseChoicesInnerFinishReasonEnum;
(function (ChatCompletionResponseChoicesInnerFinishReasonEnum) {
    ChatCompletionResponseChoicesInnerFinishReasonEnum["Stop"] = "stop";
    ChatCompletionResponseChoicesInnerFinishReasonEnum["Length"] = "length";
})(ChatCompletionResponseChoicesInnerFinishReasonEnum = exports.ChatCompletionResponseChoicesInnerFinishReasonEnum || (exports.ChatCompletionResponseChoicesInnerFinishReasonEnum = {}));
//# sourceMappingURL=ChatCompletionResponseChoicesInner.js.map