/**
 * Created by karl on 01/07/15.
 */

'use strict';

import BaseRequest = require('./base-request');
import stream = require('stream');

class StreamRequest extends BaseRequest.BaseRequest {
    constructor(opts) {
        super(opts);
    }
    // Create a request
    _request(opts:Object): stream.Stream {
        return this.base(opts);
    }
}

export = StreamRequest;