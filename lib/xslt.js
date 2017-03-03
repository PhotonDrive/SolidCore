'use strict';

const fs = require('fs');
const Transform = require('stream').Transform;
const util = require('util');
var libxslt = require('libxslt');

function xsltObject(options, stylesheets, executeOnRead) {
    if (!(this instanceof xsltObject)) {
        var xlfInstance = new xsltObject(options, stylesheets, executeOnRead);
        xlfInstance.stylesheetItems = [];
        stylesheets.forEach(function(item){
            var stylesheetData = fs.readFileSync(item, 'utf8');
            xlfInstance.stylesheetItems.push(libxslt.parse(stylesheetData));
        });
        
        if (!!executeOnRead)
            xlfInstance.on('readable', executeOnRead);
        return xlfInstance;
    }
    Transform.call(this, options);
}
util.inherits(xsltObject, Transform);

xsltObject.prototype._transform = function (chunk, encoding, done) {
    var self = this;
    var transformData = chunk.toString();
    if (this.stylesheetItems.length > 0) {
        //TODO: This implementation needs to change.
        this.stylesheetItems.forEach(function(stylesheetItem, index) {
            stylesheetItem.apply(transformData, function(err, result) {
                if (err) 
                    console.dir(err);
                if (index == self.stylesheetItems.length-1) {
                    self.push(result);
                    done();
                } else {
                    transformData = result;
                }
            });
        });
    } else {
        this.push(chunk);
        done();
    }
};

xsltObject.prototype._flush = function (done) {
    done();
};

module.exports = xsltObject;