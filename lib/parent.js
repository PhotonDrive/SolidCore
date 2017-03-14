'use strict';

const fs = require('fs');
const Transform = require('stream').Transform;
const util = require('util');

function parent(options, specifications) {
    if (!(this instanceof parent)) {
        var parentInstance = new parent(options, specifications);
        parentInstance.specifications = specifications;
        parentInstance.singleton = true;
        return parentInstance;
    }
    Transform.call(this, options);
}
util.inherits(parent, Transform);

parent.prototype._transform = function (chunk, encoding, done) {
    if (this.singleton) {
        var prefix = fs.readFileSync(this.specifications.prefix);
        this.push(prefix);
        this.singleton = false;
    }
    this.push(chunk);
    done();
};

parent.prototype._flush = function (done) {
        var suffix = fs.readFileSync(this.specifications.suffix);
        this.push(suffix);
    done();
};

module.exports = parent;