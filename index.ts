/**
 * Created by karl on 14/07/15.
 */

/// <reference path="typings/tsd.d.ts" />

'use strict';

var express = require('express');

import Request = require('./lib/request');

function RequestWrap(config) {
    return function getRequest(stream:boolean = false): Request {
        var $this = this;

        return new Request({
            req: $this,
            config: config,
            stream: !!stream
        });
    }
}

export function create(opts: {name: any; config: {url:string; internal?:boolean; headers?: string[]; cookies?: string[]; replyCookies?: string[]; jSend?: boolean; opts?: Object }}) {
    express.request[opts.name] = RequestWrap(opts.config);
}