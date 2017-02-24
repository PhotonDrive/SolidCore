'use strict';
const clone = require('clone');
module.exports = function(sourceSpecifications) {
    var dataSpecification = clone(sourceSpecifications);

    if (!dataSpecification.encoding)
        dataSpecification.encoding = 'utf8';

    if (typeof dataSpecification.supportsUnicode === 'undefined')
        dataSpecification.supportsUnicode = dataSpecification.encoding != 'ascii';

    if (typeof dataSpecification.supportsControlChars === 'undefined')
        dataSpecification.supportsControlChars = false;

    if (typeof dataSpecification.supportsNewLineChars === 'undefined')
        dataSpecification.supportsNewLineChars = false;

    if (typeof dataSpecification.terminator === 'undefined')
        dataSpecification.terminator = '\r\n';

    if (typeof dataSpecification.identifierField === 'undefined')
        dataSpecification.identifierField = 'RecordType';

    if (typeof dataSpecification.identfierStart === 'undefined')
        dataSpecification.identfierStart = 0;

    if (typeof dataSpecification.identfierLength === 'undefined')
        dataSpecification.identfierLength = 2;

    dataSpecification.records.forEach(function (record, index) {
        if (typeof record.identifier === 'undefined') 
            record.identifier = '00';
        record.length = 0;
        record.fields.forEach(function (field) {
            record.length = record.length + field.length;
            if (!dataSpecification.zeroIndexedStartingPosition)
                field.start = field.start - 1;

            field.end = field.start + field.length;

            if (typeof field.required === 'undefined')
                field.required = false;

            if (typeof field.type === 'undefined')
                field.type = "string";

            if (typeof field.name === 'undefined')
                field.name = "unknown-" + index;
        });
        //console.log(record.length);
    });
    return dataSpecification;
};