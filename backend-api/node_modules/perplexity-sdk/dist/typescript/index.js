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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultApi = exports.Middleware = exports.RequiredError = exports.Configuration = exports.createConfiguration = void 0;
var configuration_1 = require("./configuration");
var PromiseAPI_1 = require("./types/PromiseAPI");
var getConfig = function (apiKey) {
    return (0, configuration_1.createConfiguration)({
        authMethods: {
            BearerAuth: {
                'tokenProvider': {
                    getToken: function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            return [2, apiKey || ''];
                        });
                    }); }
                }
            }
        }
    });
};
var getApiInstance = function (apiKey) {
    var configuration = getConfig(apiKey);
    return new PromiseAPI_1.PromiseDefaultApi(configuration);
};
var Perplexity = (function () {
    function Perplexity(config) {
        this.instance = getApiInstance(config.apiKey);
    }
    Perplexity.prototype.client = function () {
        return this.instance;
    };
    return Perplexity;
}());
exports.default = Perplexity;
__exportStar(require("./http/http"), exports);
__exportStar(require("./auth/auth"), exports);
__exportStar(require("./models/all"), exports);
var configuration_2 = require("./configuration");
Object.defineProperty(exports, "createConfiguration", { enumerable: true, get: function () { return configuration_2.createConfiguration; } });
var configuration_3 = require("./configuration");
Object.defineProperty(exports, "Configuration", { enumerable: true, get: function () { return configuration_3.Configuration; } });
__exportStar(require("./apis/exception"), exports);
__exportStar(require("./servers"), exports);
var baseapi_1 = require("./apis/baseapi");
Object.defineProperty(exports, "RequiredError", { enumerable: true, get: function () { return baseapi_1.RequiredError; } });
var middleware_1 = require("./middleware");
Object.defineProperty(exports, "Middleware", { enumerable: true, get: function () { return middleware_1.PromiseMiddleware; } });
var PromiseAPI_2 = require("./types/PromiseAPI");
Object.defineProperty(exports, "DefaultApi", { enumerable: true, get: function () { return PromiseAPI_2.PromiseDefaultApi; } });
//# sourceMappingURL=index.js.map