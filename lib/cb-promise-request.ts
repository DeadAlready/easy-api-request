/**
 * Created by karl on 01/07/15.
 */

'use strict';

import mockLogger = require('./mock-logger');
import BaseRequest = require('./base-request');
import Q = require('q');

class CBPromiseRequest extends BaseRequest.BaseRequest {
    constructor(opts) {
        super(opts);
    }
    // Create a request
    _request(opts:Object, cb?:(err?:any, resp?: BaseRequest.Result) =>void): void | Q.Promise<BaseRequest.Result> {
        var $this = this;
        $this.log.debug({opts: opts}, 'Making a request');
        if(cb) {
            return $this.base(opts, function (err, response, body) {
                var resp = $this._parseResponse(err, response, body);
                if(resp.err) {
                    cb(resp);
                    return;
                }
                cb(null, resp);
            });
        }
        return Q.Promise<BaseRequest.Result>(function (resolve, reject) {
            $this.base(opts, function (err, response, body) {
                var resp = $this._parseResponse(err, response, body);
                if(resp.err) {
                    reject(resp);
                    return;
                }
                resolve(resp);
            });
        });
    }
}

export = CBPromiseRequest;