/**
 * Created by karl on 01/07/15.
 */
'use strict';
var mockLogger = require('./mock-logger');
var request = require('request');
var merge = require('merge');
var mask = /("password":|"cc":)(.+?)([,}])/g;
function cleanLogData(data) {
    try {
        var clean = JSON.stringify(data);
    }
    catch (ignore) {
        return data;
    }
    clean = clean.replace(mask, '$1"******"$3');
    return JSON.parse(clean);
}
var BaseRequest = (function () {
    function BaseRequest(opts) {
        this.stream = false;
        this.jSend = true;
        var config = opts.config;
        var $this = this;
        $this.req = opts.req;
        $this.stream = opts.stream;
        $this.log = $this.req.log || mockLogger;
        $this.cleanLogData = opts.cleanLogData || cleanLogData;
        $this.replyCookies = config.replyCookies || [];
        var sendHeaders = config.headers || [];
        var sendCookies = config.cookies || [];
        if (config.jSend !== undefined) {
            $this.jSend = config.jSend;
        }
        // Join headers
        var headers = {
            accept: 'application/json'
        };
        sendHeaders.forEach(function (header) {
            if ($this.req.headers[header]) {
                headers[header] = $this.req.headers[header];
            }
        });
        // If internal then forward all x- headers
        if (config.internal) {
            Object.keys($this.req.headers).forEach(function (header) {
                if (header.indexOf('x-') !== -1 && !headers[header]) {
                    headers[header] = $this.req.headers[header];
                }
            });
        }
        // Join cookies
        var cookies = [];
        var cookieMap = {};
        if ($this.req.headers.cookie) {
            $this.req.headers.cookie.split(';').map(function (str) {
                var arr = str.replace(/^\s/g, '').split('=');
                cookieMap[arr[0]] = arr[1];
            });
            sendCookies.forEach(function (cookieName) {
                if (cookieMap[cookieName]) {
                    cookies.push(cookieName + '=' + cookieMap[cookieName]);
                }
            });
            headers.cookie = cookies.join('; ');
        }
        // Clone options
        var options;
        if (!opts.config.opts) {
            options = {};
        }
        else {
            try {
                options = merge(true, opts.config.opts);
            }
            catch (e) {
                throw new TypeError('Invalid config.opts object');
            }
        }
        var baseOpts;
        if (opts.getBaseOpts) {
            baseOpts = opts.getBaseOpts($this.req);
        }
        merge(options, baseOpts || {});
        // Attach defaults
        options.baseUrl = config.url;
        options.headers = merge(options.headers || {}, headers);
        options.gzip = true;
        $this.base = request.defaults(options);
    }
    BaseRequest.prototype._parseResponse = function (err, response, body) {
        var $this = this;
        $this.log.trace('API call ended');
        var resp = {
            response: response,
            body: body
        };
        if (err) {
            $this.log.error({ error: err }, 'API call errored');
            resp.err = err;
            return resp;
        }
        // Forward cookies so we can use with old portal unless we have already set headers
        if ($this.replyCookies.length && response.headers['set-cookie'] && !$this.req.res._emittedHeader) {
            response.headers['set-cookie'].forEach(function (header) {
                var optsArr = header.split('; ');
                var keyValArr = optsArr.shift().split('=');
                if ($this.replyCookies.indexOf(keyValArr[0]) === -1) {
                    return;
                }
                var opts = {};
                optsArr.forEach(function (val) {
                    if (val === 'HttpOnly') {
                        opts.httpOnly = true;
                        return;
                    }
                    var arr = val.split('=');
                    var key = arr[0].toLowerCase();
                    if (key === 'max-age') {
                        opts.maxAge = arr[1] * 1000;
                        return;
                    }
                    if (key === 'expires') {
                        opts.expires = new Date(arr[1]);
                        return;
                    }
                    opts[key] = arr[1];
                });
                $this.req.res.cookie(keyValArr[0], decodeURIComponent(keyValArr[1]), opts);
            });
        }
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
                resp.body = body;
            }
            catch (e) {
                $this.log.error({ error: e }, 'Failed to parse JSON');
                resp.err = e;
                return resp;
            }
        }
        if ($this.jSend) {
            if (!body.status) {
                $this.log.warn({ body: body }, 'API call responded with non JSend structure');
                resp.err = new Error('Invalid response');
                return resp;
            }
            if (body.status !== 'success') {
                $this.log.warn({ body: body }, 'API call responded with non success status');
                resp.err = new Error('Non success response');
                return resp;
            }
            $this.log.info({ data: body.data }, 'API call ended with success');
            resp.data = body.data;
        }
        else if (response.statusCode >= 400) {
            $this.log.warn({ body: body }, 'API call responded with non success status code');
            resp.err = body;
        }
        return resp;
    };
    // Function to parse input arguments into options
    BaseRequest.prototype._parseOptions = function (args, type) {
        var opts = {};
        var cb;
        if (typeof args[0] === 'string') {
            opts.url = args[0];
        }
        else if (typeof args[0] === 'object') {
            opts = args[0];
        }
        else {
            throw new TypeError('First parameter expected to be url or object');
        }
        if (typeof args[1] === 'object') {
            if (type === 'GET' || type === 'DELETE') {
                opts.qs = args[1];
            }
            else {
                opts.json = args[1];
            }
        }
        else if (typeof args[1] === 'function') {
            cb = args[1];
        }
        if (typeof args[2] === 'function') {
            cb = args[2];
        }
        opts.method = type;
        if (opts.params) {
            Object.keys(opts.params).forEach(function (param) {
                opts.url = opts.url.replace(new RegExp('\:' + param), opts.params[param]);
            });
            delete opts.params;
        }
        return {
            opts: opts,
            cb: cb
        };
    };
    // Parse and make a request for specific type of request
    BaseRequest.prototype._do = function (args, type) {
        if (type === void 0) { type = 'GET'; }
        var opts = this._parseOptions(args, type);
        return this._request(opts.opts, opts.cb);
    };
    // Create a request
    BaseRequest.prototype._request = function (opts, cb) {
        console.log('Must be implemented by child class');
        process.exit();
    };
    BaseRequest.prototype.get = function () {
        return this._do(arguments, 'GET');
    };
    BaseRequest.prototype.post = function () {
        return this._do(arguments, 'POST');
    };
    BaseRequest.prototype.patch = function () {
        return this._do(arguments, 'PATCH');
    };
    BaseRequest.prototype.del = function () {
        return this._do(arguments, 'DELETE');
    };
    return BaseRequest;
})();
exports.BaseRequest = BaseRequest;
//# sourceMappingURL=base-request.js.map