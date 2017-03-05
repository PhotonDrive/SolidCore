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
        var submitterPrefix = fs.readFileSync(this.specifications.submitterPrefix);
        this.push(submitterPrefix);
        this.singleton = false;
    }
    this.push(chunk);
    done();
};

parent.prototype._flush = function (done) {
        var submitterSuffix = fs.readFileSync(this.specifications.submitterSuffix);
        this.push(submitterSuffix);
    done();
};

module.exports = parent;