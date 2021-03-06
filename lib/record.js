'use strict';
const Transform = require('stream').Transform;
const util = require('util');

function record(options, dataSpecification, executeOnRead) {
    if (!(this instanceof record)) {
        var rfInstance = new record(options, dataSpecification, executeOnRead);
        rfInstance.dataSpecification = rfInstance.compileSpecification(dataSpecification);
        if (!!executeOnRead)
            rfInstance.on('readable', executeOnRead);
        /*
        rfInstance.on('readable', function () {
            var line = this.read();
            if (!!line)
                console.log(line.toString().substring(0, 20) + ' - NK');
        });
        */
        return rfInstance;
    }
    Transform.call(this, options);
}
util.inherits(record, Transform);

record.prototype.parse = require('./parse');
record.prototype.compileSpecification = require('./compile');

record.prototype._transform = function (chunk, encoding, done) {
    var data = chunk.toString();
    if (this._lastLineData) 
        data = this._lastLineData + data; 

    var lines = data.split(this.dataSpecification.terminator); 
    this._lastLineData = lines.splice(lines.length-1,1)[0]; 

    lines.forEach(function(line){this.push(this.parse(line, this.dataSpecification));}, this);
    done();
};

record.prototype._flush = function (done) {
    if (this._lastLineData) 
        this.push(this._lastLineData);
    this._lastLineData = null;
    done();
};

module.exports = record;