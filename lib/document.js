'use strict';

const Transform = require('stream').Transform;
const util = require('util');

function document(options, specification, executeOnRead) {
    if (!(this instanceof document)) {
        var dfInstance = new document(options, specification, executeOnRead);
        dfInstance.dataSpecification = specification;
        if (!!executeOnRead)
            dfInstance.on('readable', executeOnRead);
        return dfInstance;
    }
    Transform.call(this, options);
}
util.inherits(document, Transform);

document.prototype._transform = function (chunk, encoding, done) {
    this.push(chunk);
    done();
};

document.prototype._flush = function (done) {
    done();
};

module.exports = document;