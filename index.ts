/**
 * Created by karl on 14/07/15.
 */

/// <reference path="typings/tsd.d.ts" />

'use strict';

var express = require('express');

import CBPromiseRequest = require('./lib/cb-promise-request');
import StreamRequest = require('./lib/stream-request');

function RequestWrap(config) {
    return function getRequest(stream:boolean = false): StreamRequest | CBPromiseRequest {
        var $this = this;

        if(stream) {
            return new StreamRequest({
                req: $this,
                config: config
            });
        }

        return new CBPromiseRequest({
            req: $this,
            config: config
        });
    }
}

export function create(opts: {name: any; config: {url:string; internal?:boolean; headers?: string[]; cookies?: string[]; replyCookies?: string[]; jSend?: boolean; opts?: Object }}) {
    express.request[opts.name] = RequestWrap(opts.config);
}