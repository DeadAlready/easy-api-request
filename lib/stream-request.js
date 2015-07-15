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
var StreamRequest = (function (_super) {
    __extends(StreamRequest, _super);
    function StreamRequest(opts) {
        _super.call(this, opts);
    }
    // Create a request
    StreamRequest.prototype._request = function (opts) {
        return this.base(opts);
    };
    return StreamRequest;
})(BaseRequest.BaseRequest);
module.exports = StreamRequest;
//# sourceMappingURL=stream-request.js.map