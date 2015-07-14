/**
 * Created by karl on 14/07/15.
 */

'use strict';

var mockLogger = {};
['trace','debug','info','warn', 'error', 'fatal'].forEach(function (name) {
    mockLogger[name] = function (obj, text) {
        var json = {
            lvl: name,
            data: obj,
            text: text
        };
        console.log(JSON.stringify(json));
    };
});

export = mockLogger;