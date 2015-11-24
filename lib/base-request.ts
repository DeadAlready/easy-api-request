/**
 * Created by karl on 01/07/15.
 */

'use strict';

import mockLogger = require('./mock-logger');
import request = require('request');
import http = require('http');

var merge = require('merge');

var mask = /("[^"]*?password[^"]*?":|"cc":)(.+?)([,}])/g;

function cleanLogData(data) {
    try {
        var clean = JSON.stringify(data);
    } catch(ignore) {
        return data;
    }

    clean = clean.replace(mask, '$1"******"$3');

    return JSON.parse(clean);
}

var semiRegex = /;/g;
var xHeaderRegex = /^x-/i;

export class BaseRequest {
    protected base;
    protected req;
    protected log;
    protected replyCookieRegex: any;
    protected stream:boolean = false;
    protected jSend:boolean = true;
    protected cleanLogData:Function;
    constructor(opts) {
        var config = opts.config;
        var $this = this;

        $this.req = opts.req;
        $this.stream = opts.stream;
        $this.log = $this.req.log || mockLogger;
        $this.cleanLogData = config.cleanLogData || cleanLogData;
        var replyCookies = config.replyCookies || [];
        if(replyCookies.length) {
            $this.replyCookieRegex = new RegExp('^(' + replyCookies.join('|') + ')=');
        }

        var sendHeaders = config.headers || [];
        var sendCookies = config.cookies || [];
        var sendCookieRegex;
        if(sendCookies.length) {
            sendCookieRegex = new RegExp(' (' + sendCookies.join('|') + ')=(.+?);', 'g');
        }
        if(config.jSend !== undefined) {
            $this.jSend = config.jSend;
        }

        // Join headers
        var headers:any = {
            accept: 'application/json'
        };
        sendHeaders.forEach(function (header){
            if($this.req.header(header)) {
                headers[header] = $this.req.header(header);
            }
        });

        // If internal then forward all x- headers
        if(config.internal) {
            Object.keys($this.req.headers).forEach(function (header) {
                if(header.search(xHeaderRegex) !== -1 && !headers[header]) {
                    headers[header] = $this.req.headers[header];
                }
            });
        }

        // Join cookies
        var cookies = [];
        var cookieTemp;
        if($this.req.headers.cookie && sendCookieRegex) {
            cookieTemp = ' ' + $this.req.headers.cookie.replace(semiRegex, '; ') + ';';
            cookies = cookieTemp.match(sendCookieRegex);
            if(cookies) {
                headers.cookie = cookies.join(' ');
            }
        }

        // Clone options
        var options;
        if(!opts.config.opts) {
            options = {};
        } else {
            try {
                options = merge(true, opts.config.opts);
            } catch (e) {
                throw new TypeError('Invalid config.opts object');
            }
        }

        if(typeof opts.requestOpts === 'object') {
            merge(options, opts.requestOpts);
        }

        // Attach defaults
        options.baseUrl = config.url;
        options.headers = merge(options.headers || {}, headers);
        options.gzip = true;

        $this.base = request.defaults(options);
    }
    _parseResponse(err:any, response: http.IncomingMessage, body: any) {
        var $this = this;
        $this.log.trace('API call ended');
        var resp:any = {
            response: response,
            body: body
        };
        if(err) {
            $this.log.error({error: err}, 'API call errored');
            resp.err = err;
            return resp;
        }

        // Forward cookies so we can use with old portal unless we have already set headers
        if($this.replyCookieRegex && response.headers['set-cookie'] && !$this.req.res.headerSent){
            var currentSetCookie = $this.req.res.getHeader('set-cookie');
            var haveToSet = false;
            response.headers['set-cookie'].forEach(function (header) {
                if(!$this.replyCookieRegex.test(header)) {
                    return;
                }
                if(currentSetCookie.indexOf(header) === -1) {
                    haveToSet = true;
                    currentSetCookie.unshift(header);
                }
            });
            if(haveToSet) {
                $this.req.res.setHeader('set-cookie', currentSetCookie);
            }
        }

        if(typeof body === 'string') {
            try {
                body = JSON.parse(body);
                resp.body = body;
            } catch(e) {
                $this.log.error({error: e}, 'Failed to parse JSON');
                resp.err = e;
                return resp;
            }
        }
        if($this.jSend) {
            if(!body.status) {
                $this.log.warn({body: body}, 'API call responded with non JSend structure');
                resp.err = new Error('Invalid response');
                return resp;
            }
            if(body.status !== 'success') {
                $this.log.warn({body: body}, 'API call responded with non success status');
                resp.err = new Error('Non success response');
                return resp;
            }
            $this.log.info({data: body.data}, 'API call ended with success');
            resp.data = body.data;
        } else if(response.statusCode >= 400) {
            $this.log.warn({body: body}, 'API call responded with non success status code');
            resp.err = body;
        }
        return resp;
    }
    // Function to parse input arguments into options
    _parseOptions(args:IArguments, type:string): any {
        var opts:any = {};
        var cb;
        if(typeof args[0] === 'string') {
            opts.url = args[0];
        } else if(typeof args[0] === 'object') {
            opts = args[0];
        } else {
            throw new TypeError('First parameter expected to be url or object');
        }

        if(typeof args[1] === 'object') {
            if(type === 'GET' || type === 'DELETE') {
                opts.qs = args[1];
            } else {
                opts.json = args[1];
            }
        } else if(typeof args[1] === 'function') {
            cb = args[1];
        }

        if(typeof args[2] === 'function') {
            cb = args[2];
        }

        opts.method = type;
        if(opts.params) {
            var regex = new RegExp('\:' + Object.keys(opts.params).join('|') + '(\/|$)', 'g');
            opts.url = opts.url.replace(regex, function (match, param, dash) {
                return opts.params[param] + dash;
            });
            delete opts.params;
        }

        return {
            opts: opts,
            cb: cb
        }
    }
    // Parse and make a request for specific type of request
    _do(args:IArguments, type:string = 'GET') {
        var opts = this._parseOptions(args, type);
        return this._request(opts.opts, opts.cb);
    }
    // Create a request
    _request(opts?:any, cb?: any): any {
        console.log('Must be implemented by child class');
        process.exit();
    }
    get(): any { return this._do(arguments, 'GET'); }
    post(): any { return this._do(arguments, 'POST'); }
    patch(): any { return this._do(arguments, 'PATCH'); }
    del(): any { return this._do(arguments, 'DELETE'); }
}

export interface Result {
    response: http.IncomingMessage;
    body: any;
    err?: any;
    data?: any;
}