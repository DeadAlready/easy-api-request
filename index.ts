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

interface InputOptions {
    name: any;
    config: any;
}

export function create(opts: InputOptions) {
    express.request[opts.name] = RequestWrap(opts.config);
}