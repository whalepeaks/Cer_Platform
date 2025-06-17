"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorResponseError = void 0;
var ErrorResponseError = (function () {
    function ErrorResponseError() {
    }
    ErrorResponseError.getAttributeTypeMap = function () {
        return ErrorResponseError.attributeTypeMap;
    };
    ErrorResponseError.discriminator = undefined;
    ErrorResponseError.attributeTypeMap = [
        {
            "name": "code",
            "baseName": "code",
            "type": "number",
            "format": ""
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string",
            "format": ""
        }
    ];
    return ErrorResponseError;
}());
exports.ErrorResponseError = ErrorResponseError;
//# sourceMappingURL=ErrorResponseError.js.map