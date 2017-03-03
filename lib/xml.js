'use strict';

const Transform = require('stream').Transform;
const util = require('util');
const js2xmlparser = require("js2xmlparser");

function xmlObject(options, nodeName, executeOnRead) {
    if (!(this instanceof xmlObject)) {
        var xfInstance = new xmlObject(options, executeOnRead);
        xfInstance.nodeName = nodeName || "Activity";
        if (!!executeOnRead)
            xfInstance.on('readable', executeOnRead);
        return xfInstance;
    }
    Transform.call(this, options);
}
util.inherits(xmlObject, Transform);

xmlObject.prototype._transform = function (chunk, encoding, done) {
    var data = JSON.parse(chunk.toString());
    this.push(js2xmlparser.parse(this.nodeName, data, {declaration:{include:false}}));
    done();
};

xmlObject.prototype._flush = function (done) {
    done();
};

module.exports = xmlObject;