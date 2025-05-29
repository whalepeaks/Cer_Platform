"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectSerializer = void 0;
__exportStar(require("../models/ChatCompletionResponse"), exports);
__exportStar(require("../models/ChatCompletionResponseChoicesInner"), exports);
__exportStar(require("../models/ChatCompletionResponseChoicesInnerDelta"), exports);
__exportStar(require("../models/ChatCompletionResponseUsage"), exports);
__exportStar(require("../models/ChatCompletionsPostRequest"), exports);
__exportStar(require("../models/ChatCompletionsPostRequestMessagesInner"), exports);
__exportStar(require("../models/ErrorResponse"), exports);
__exportStar(require("../models/ErrorResponseError"), exports);
var ChatCompletionResponse_1 = require("../models/ChatCompletionResponse");
var ChatCompletionResponseChoicesInner_1 = require("../models/ChatCompletionResponseChoicesInner");
var ChatCompletionResponseChoicesInnerDelta_1 = require("../models/ChatCompletionResponseChoicesInnerDelta");
var ChatCompletionResponseUsage_1 = require("../models/ChatCompletionResponseUsage");
var ChatCompletionsPostRequest_1 = require("../models/ChatCompletionsPostRequest");
var ChatCompletionsPostRequestMessagesInner_1 = require("../models/ChatCompletionsPostRequestMessagesInner");
var ErrorResponse_1 = require("../models/ErrorResponse");
var ErrorResponseError_1 = require("../models/ErrorResponseError");
var primitives = [
    "string",
    "boolean",
    "double",
    "integer",
    "long",
    "float",
    "number",
    "any"
];
var enumsMap = new Set([
    "ChatCompletionResponseObjectEnum",
    "ChatCompletionResponseChoicesInnerFinishReasonEnum",
    "ChatCompletionsPostRequestModelEnum",
]);
var typeMap = {
    "ChatCompletionResponse": ChatCompletionResponse_1.ChatCompletionResponse,
    "ChatCompletionResponseChoicesInner": ChatCompletionResponseChoicesInner_1.ChatCompletionResponseChoicesInner,
    "ChatCompletionResponseChoicesInnerDelta": ChatCompletionResponseChoicesInnerDelta_1.ChatCompletionResponseChoicesInnerDelta,
    "ChatCompletionResponseUsage": ChatCompletionResponseUsage_1.ChatCompletionResponseUsage,
    "ChatCompletionsPostRequest": ChatCompletionsPostRequest_1.ChatCompletionsPostRequest,
    "ChatCompletionsPostRequestMessagesInner": ChatCompletionsPostRequestMessagesInner_1.ChatCompletionsPostRequestMessagesInner,
    "ErrorResponse": ErrorResponse_1.ErrorResponse,
    "ErrorResponseError": ErrorResponseError_1.ErrorResponseError,
};
var parseMimeType = function (mimeType) {
    var _a = mimeType.split('/'), type = _a[0], subtype = _a[1];
    return {
        type: type,
        subtype: subtype,
        subtypeTokens: subtype.split('+'),
    };
};
var mimeTypePredicateFactory = function (predicate) { return function (mimeType) { return predicate(parseMimeType(mimeType)); }; };
var mimeTypeSimplePredicateFactory = function (type, subtype) { return mimeTypePredicateFactory(function (descriptor) {
    if (descriptor.type !== type)
        return false;
    if (subtype != null && descriptor.subtype !== subtype)
        return false;
    return true;
}); };
var isTextLikeMimeType = mimeTypeSimplePredicateFactory('text');
var isJsonMimeType = mimeTypeSimplePredicateFactory('application', 'json');
var isJsonLikeMimeType = mimeTypePredicateFactory(function (descriptor) { return descriptor.type === 'application' && descriptor.subtypeTokens.some(function (item) { return item === 'json'; }); });
var isOctetStreamMimeType = mimeTypeSimplePredicateFactory('application', 'octet-stream');
var isFormUrlencodedMimeType = mimeTypeSimplePredicateFactory('application', 'x-www-form-urlencoded');
var supportedMimeTypePredicatesWithPriority = [
    isJsonMimeType,
    isJsonLikeMimeType,
    isTextLikeMimeType,
    isOctetStreamMimeType,
    isFormUrlencodedMimeType,
];
var ObjectSerializer = (function () {
    function ObjectSerializer() {
    }
    ObjectSerializer.findCorrectType = function (data, expectedType) {
        if (data == undefined) {
            return expectedType;
        }
        else if (primitives.indexOf(expectedType.toLowerCase()) !== -1) {
            return expectedType;
        }
        else if (expectedType === "Date") {
            return expectedType;
        }
        else {
            if (enumsMap.has(expectedType)) {
                return expectedType;
            }
            if (!typeMap[expectedType]) {
                return expectedType;
            }
            var discriminatorProperty = typeMap[expectedType].discriminator;
            if (discriminatorProperty == null) {
                return expectedType;
            }
            else {
                if (data[discriminatorProperty]) {
                    var discriminatorType = data[discriminatorProperty];
                    if (typeMap[discriminatorType]) {
                        return discriminatorType;
                    }
                    else {
                        return expectedType;
                    }
                }
                else {
                    return expectedType;
                }
            }
        }
    };
    ObjectSerializer.serialize = function (data, type, format) {
        if (data == undefined) {
            return data;
        }
        else if (primitives.indexOf(type.toLowerCase()) !== -1) {
            return data;
        }
        else if (type.lastIndexOf("Array<", 0) === 0) {
            var subType = type.replace("Array<", "");
            subType = subType.substring(0, subType.length - 1);
            var transformedData = [];
            for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
                var date = data_1[_i];
                transformedData.push(ObjectSerializer.serialize(date, subType, format));
            }
            return transformedData;
        }
        else if (type === "Date") {
            if (format == "date") {
                var month = data.getMonth() + 1;
                month = month < 10 ? "0" + month.toString() : month.toString();
                var day = data.getDate();
                day = day < 10 ? "0" + day.toString() : day.toString();
                return data.getFullYear() + "-" + month + "-" + day;
            }
            else {
                return data.toISOString();
            }
        }
        else {
            if (enumsMap.has(type)) {
                return data;
            }
            if (!typeMap[type]) {
                return data;
            }
            type = this.findCorrectType(data, type);
            var attributeTypes = typeMap[type].getAttributeTypeMap();
            var instance = {};
            for (var _a = 0, attributeTypes_1 = attributeTypes; _a < attributeTypes_1.length; _a++) {
                var attributeType = attributeTypes_1[_a];
                instance[attributeType.baseName] = ObjectSerializer.serialize(data[attributeType.name], attributeType.type, attributeType.format);
            }
            return instance;
        }
    };
    ObjectSerializer.deserialize = function (data, type, format) {
        type = ObjectSerializer.findCorrectType(data, type);
        if (data == undefined) {
            return data;
        }
        else if (primitives.indexOf(type.toLowerCase()) !== -1) {
            return data;
        }
        else if (type.lastIndexOf("Array<", 0) === 0) {
            var subType = type.replace("Array<", "");
            subType = subType.substring(0, subType.length - 1);
            var transformedData = [];
            for (var _i = 0, data_2 = data; _i < data_2.length; _i++) {
                var date = data_2[_i];
                transformedData.push(ObjectSerializer.deserialize(date, subType, format));
            }
            return transformedData;
        }
        else if (type === "Date") {
            return new Date(data);
        }
        else {
            if (enumsMap.has(type)) {
                return data;
            }
            if (!typeMap[type]) {
                return data;
            }
            var instance = new typeMap[type]();
            var attributeTypes = typeMap[type].getAttributeTypeMap();
            for (var _a = 0, attributeTypes_2 = attributeTypes; _a < attributeTypes_2.length; _a++) {
                var attributeType = attributeTypes_2[_a];
                var value = ObjectSerializer.deserialize(data[attributeType.baseName], attributeType.type, attributeType.format);
                if (value !== undefined) {
                    instance[attributeType.name] = value;
                }
            }
            return instance;
        }
    };
    ObjectSerializer.normalizeMediaType = function (mediaType) {
        if (mediaType === undefined) {
            return undefined;
        }
        return mediaType.split(";")[0].trim().toLowerCase();
    };
    ObjectSerializer.getPreferredMediaType = function (mediaTypes) {
        if (mediaTypes.length === 0) {
            return "application/json";
        }
        var normalMediaTypes = mediaTypes.map(this.normalizeMediaType);
        for (var _i = 0, supportedMimeTypePredicatesWithPriority_1 = supportedMimeTypePredicatesWithPriority; _i < supportedMimeTypePredicatesWithPriority_1.length; _i++) {
            var predicate = supportedMimeTypePredicatesWithPriority_1[_i];
            for (var _a = 0, normalMediaTypes_1 = normalMediaTypes; _a < normalMediaTypes_1.length; _a++) {
                var mediaType = normalMediaTypes_1[_a];
                if (mediaType != null && predicate(mediaType)) {
                    return mediaType;
                }
            }
        }
        throw new Error("None of the given media types are supported: " + mediaTypes.join(", "));
    };
    ObjectSerializer.stringify = function (data, mediaType) {
        if (isTextLikeMimeType(mediaType)) {
            return String(data);
        }
        if (isJsonLikeMimeType(mediaType)) {
            return JSON.stringify(data);
        }
        throw new Error("The mediaType " + mediaType + " is not supported by ObjectSerializer.stringify.");
    };
    ObjectSerializer.parse = function (rawData, mediaType) {
        if (mediaType === undefined) {
            throw new Error("Cannot parse content. No Content-Type defined.");
        }
        if (isTextLikeMimeType(mediaType)) {
            return rawData;
        }
        if (isJsonLikeMimeType(mediaType)) {
            return JSON.parse(rawData);
        }
        throw new Error("The mediaType " + mediaType + " is not supported by ObjectSerializer.parse.");
    };
    return ObjectSerializer;
}());
exports.ObjectSerializer = ObjectSerializer;
//# sourceMappingURL=ObjectSerializer.js.map