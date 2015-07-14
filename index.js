/**
 * Created by karl on 14/07/15.
 */
/// <reference path="typings/tsd.d.ts" />
'use strict';
var express = require('express');
var Request = require('./lib/request');
function RequestWrap(config) {
    return function getRequest(stream) {
        if (stream === void 0) { stream = false; }
        var $this = this;
        return new Request({
            req: $this,
            config: config,
            stream: !!stream
        });
    };
}
function create(opts) {
    express.request[opts.name] = RequestWrap(opts.config);
}
exports.create = create;
//# sourceMappingURL=index.js.map