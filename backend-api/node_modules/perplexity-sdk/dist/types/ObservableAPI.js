"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObservableDefaultApi = void 0;
var rxjsStub_1 = require("../rxjsStub");
var rxjsStub_2 = require("../rxjsStub");
var DefaultApi_1 = require("../apis/DefaultApi");
var ObservableDefaultApi = (function () {
    function ObservableDefaultApi(configuration, requestFactory, responseProcessor) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new DefaultApi_1.DefaultApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new DefaultApi_1.DefaultApiResponseProcessor();
    }
    ObservableDefaultApi.prototype.chatCompletionsPostWithHttpInfo = function (chatCompletionsPostRequest, _options) {
        var _this = this;
        var requestContextPromise = this.requestFactory.chatCompletionsPost(chatCompletionsPostRequest, _options);
        var middlewarePreObservable = (0, rxjsStub_1.from)(requestContextPromise);
        var _loop_1 = function (middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)(function (ctx) { return middleware.pre(ctx); }));
        };
        for (var _i = 0, _a = this.configuration.middleware; _i < _a.length; _i++) {
            var middleware = _a[_i];
            _loop_1(middleware);
        }
        return middlewarePreObservable.pipe((0, rxjsStub_2.mergeMap)(function (ctx) { return _this.configuration.httpApi.send(ctx); })).
            pipe((0, rxjsStub_2.mergeMap)(function (response) {
            var middlewarePostObservable = (0, rxjsStub_1.of)(response);
            var _loop_2 = function (middleware) {
                middlewarePostObservable = middlewarePostObservable.pipe((0, rxjsStub_2.mergeMap)(function (rsp) { return middleware.post(rsp); }));
            };
            for (var _i = 0, _a = _this.configuration.middleware; _i < _a.length; _i++) {
                var middleware = _a[_i];
                _loop_2(middleware);
            }
            return middlewarePostObservable.pipe((0, rxjsStub_2.map)(function (rsp) { return _this.responseProcessor.chatCompletionsPostWithHttpInfo(rsp); }));
        }));
    };
    ObservableDefaultApi.prototype.chatCompletionsPost = function (chatCompletionsPostRequest, _options) {
        return this.chatCompletionsPostWithHttpInfo(chatCompletionsPostRequest, _options).pipe((0, rxjsStub_2.map)(function (apiResponse) { return apiResponse.data; }));
    };
    return ObservableDefaultApi;
}());
exports.ObservableDefaultApi = ObservableDefaultApi;
//# sourceMappingURL=ObservableAPI.js.map