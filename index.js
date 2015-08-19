/**
 * Created by karl on 14/07/15.
 */
/// <reference path="typings/tsd.d.ts" />
'use strict';
var e = require('express');
var CBPromiseRequest = require('./lib/cb-promise-request');
var StreamRequest = require('./lib/stream-request');
function RequestWrap(config) {
    return function getRequest(stream, getBaseOpts) {
        if (stream === void 0) { stream = false; }
        var $this = this;
        if (stream) {
            return new StreamRequest({
                req: $this,
                config: config,
                getBaseOpts: getBaseOpts
            });
        }
        return new CBPromiseRequest({
            req: $this,
            config: config,
            getBaseOpts: getBaseOpts
        });
    };
}
function create(opts) {
    var express = opts.express || e;
    express.request[opts.name] = RequestWrap(opts.config);
}
exports.create = create;
//# sourceMappingURL=index.js.map