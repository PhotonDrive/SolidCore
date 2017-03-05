'use strict';

const fs = require('fs');
var libxslt = require('libxslt');
//libxslt.registerFunction ('urn:nilesh','sequenceOne', 'var i=0; function sequenceOne(start, end) { i++; return i;}')
function xsltObject(options, stylesheets) {
    if (!(this instanceof xsltObject)) {
        var xlfInstance = new xsltObject(options, stylesheets);
        xlfInstance.stylesheetItems = [];
        var stylesheetRawData = '';
        try {
            stylesheets.forEach(function (item) {
                console.log('Loading ' + item);
                stylesheetRawData = libxslt.libxmljs.parseXml(fs.readFileSync(item, 'utf8'));
                xlfInstance.stylesheetItems.push(libxslt.parse(stylesheetRawData));
                stylesheetRawData = '';
            });
        } catch (e) {
            throw new Error(e.message);
        }
        return xlfInstance;
    }
};

xsltObject.prototype.transform = function (fileName, parameters, callback) {
    try {
        var inputDocument = libxslt.libxmljs.parseXml(fs.readFileSync(fileName));
        if ((this.stylesheetItems.length > 0) && (!!inputDocument)) {
            this.stylesheetItems.forEach(function (stylesheetItem, index) {
                try {
                    inputDocument = stylesheetItem.apply(inputDocument, parameters, {outputFormat: 'string', noWrapParams: true});
                } catch (e) {
                    throw new Error(e.message);
                }
            });
            if (!!callback) {
                callback(inputDocument);
            }
        }
    } catch (e) {
        throw new Error(e.message);
    }
};

module.exports = xsltObject;