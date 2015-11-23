/**
 * Created by karl on 14/07/15.
 */

/// <reference path="typings/tsd.d.ts" />

'use strict';

var e = require('express');

import CBPromiseRequest = require('./lib/cb-promise-request');
import StreamRequest = require('./lib/stream-request');

function RequestWrap(config) {
    return function getRequest(stream:boolean = false, requestOpts?: Object): StreamRequest | CBPromiseRequest {
        var $this = this;

        if(stream) {
            return new StreamRequest({
                req: $this,
                config: config,
                requestOpts: requestOpts
            });
        }

        return new CBPromiseRequest({
            req: $this,
            config: config,
            requestOpts: requestOpts
        });
    }
}

interface Config {
    name: any;
    config: {
        url:string;
        internal?:boolean;
        headers?: string[];
        cookies?: string[];
        replyCookies?: string[];
        jSend?: boolean;
        opts?: Object;
        cleanLogData?: Function;
    };
    express?: any;
}

export function create(opts: Config) {
    var express = opts.express || e;

    express.request[opts.name] = RequestWrap(opts.config);
}