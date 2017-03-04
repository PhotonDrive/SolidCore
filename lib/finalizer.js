'use strict';

//const fs = require('fs');
const Transform = require('stream').Transform;
const util = require('util');

function finalizer(options, prefix, suffix, executeOnRead) {
    if (!(this instanceof finalizer)) {
        var finalInstance = new finalizer(options, prefix, suffix, executeOnRead);
            //var prefixData = fs.readFileSync(prefix, 'utf8');
            //var suffixData = fs.readFileSync(suffix, 'utf8');
        finalInstance.prefix = prefix;
        finalInstance.suffix = suffix;
        finalInstance.singleton = true;
        return finalInstance;
    }
    Transform.call(this, options);
}
util.inherits(finalizer, Transform);

finalizer.prototype._transform = function (chunk, encoding, done) {
    if (this.singleton) {
        this.push(this.prefix)
        this.singleton = false;
    }
    this.push(chunk);
    done();
};

finalizer.prototype._flush = function (done) {
    this.push(this.suffix);
    done();
};

module.exports = finalizer;