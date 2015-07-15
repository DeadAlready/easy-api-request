/**
 * Created by karl on 01/07/15.
 */
'use strict';
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BaseRequest = require('./base-request');
var Q = require('q');
var CBPromiseRequest = (function (_super) {
    __extends(CBPromiseRequest, _super);
    function CBPromiseRequest(opts) {
        _super.call(this, opts);
    }
    // Create a request
    CBPromiseRequest.prototype._request = function (opts, cb) {
        var $this = this;
        $this.log.debug({ opts: opts }, 'Making a request');
        if (cb) {
            return $this.base(opts, function (err, response, body) {
                var resp = $this._parseResponse(err, response, body);
                if (resp.err) {
                    cb(resp);
                    return;
                }
                cb(null, resp);
            });
        }
        return Q.Promise(function (resolve, reject) {
            $this.base(opts, function (err, response, body) {
                var resp = $this._parseResponse(err, response, body);
                if (resp.err) {
                    reject(resp);
                    return;
                }
                resolve(resp);
            });
        });
    };
    return CBPromiseRequest;
})(BaseRequest.BaseRequest);
module.exports = CBPromiseRequest;
//# sourceMappingURL=cb-promise-request.js.map