'use strict';

const Transform = require('stream').Transform;
const util = require('util');
const _ = require('lodash');
const maxRecord = '[MAX]';
const codeRecord = "Code_";

function objectFactory(options, mapSpecification, executeOnRead) {
    if (!(this instanceof objectFactory)) {
        var ofInstance = new objectFactory(options, mapSpecification, executeOnRead);
        ofInstance.mapSpecification = mapSpecification;
        if (!!executeOnRead)
            ofInstance.on('readable', executeOnRead);
        return ofInstance;
    }
    Transform.call(this, options);
}
util.inherits(objectFactory, Transform);

objectFactory.prototype._transform = function (chunk, encoding, done) {
    var data = JSON.parse(chunk.toString());
    var output = this.mapSpecification[this.mapSpecification.TargetElement] ||{};
    var mappedTarget = [];
    data.Record.forEach(function(record) {
        mappedTarget = this.mapSpecification.recordMaps.filter(function (mapItem) {
            return record.RecordType === mapItem.RecordType;
        })[0];
        if (!!mappedTarget) {
            mappedTarget.TargetHierarchy.forEach(function (mappedItem) {
                if (!!mappedTarget.TargetIncrement) {
                    var TargetIncementProperty = mappedTarget.TargetIncementProperty; 
                    if (TargetIncementProperty.indexOf(maxRecord) > -1) {
                        mappedTarget.ParentIncementedValue = ((_.get(output, mappedTarget.ParentRecord) || []).length -1) || 0;
                        TargetIncementProperty = TargetIncementProperty.replace (maxRecord, '[' + mappedTarget.ParentIncementedValue + ']');
                    }
                    mappedTarget.TargetIncementedValue = (_.get(output, TargetIncementProperty) || []).length || 0;
                }
                Object.keys(mappedItem).forEach(function(key) {
                    var targetProperty = mappedItem[key];
                    if (key.indexOf('*') > -1) {
                        _.set(output, targetProperty,  record[key.split('*')[0]]);
                    } else if (key.indexOf('$') > -1) {
                        var targetValue = key.split('$');
                        var sourceProperty = targetValue[0];
                        if (!!mappedTarget.TargetIncrement) {
                            targetProperty = targetProperty.replace (mappedTarget.TargetIncementProperty+'[0]', mappedTarget.TargetIncementProperty+'['+ mappedTarget.TargetIncementedValue +']');
                        }
                        if (targetValue[1] ===  record[sourceProperty]) {
                            _.set(output, targetProperty, targetValue[2]);
                        }
                    } else if (((!!mappedItem[key]) && (!!record[key])) || (key.indexOf(codeRecord) > -1)) {
                        
                        if (!!mappedTarget.TargetIncrement) {
                            targetProperty = targetProperty.replace (mappedTarget.TargetIncementProperty+'[0]', mappedTarget.TargetIncementProperty+'['+ mappedTarget.TargetIncementedValue +']');

                            if (targetProperty.indexOf(maxRecord) > -1) {
                                targetProperty = targetProperty.replace (maxRecord, '[' + mappedTarget.ParentIncementedValue + ']');
                                //console.log(targetProperty + ' ' + record[key]  + ' ' + mappedTarget.ParentIncementedValue);
                            }

                        }
                        if (key.indexOf(codeRecord) === -1) {
                            _.set(output, targetProperty, record[key]);
                        } else {
                            //console.log ('targetProprty: ' + targetProperty + ' V: ' + key.substr(5));
                            _.set(output, targetProperty, key.substr(5));
                        }
                    }
                });
            });
        }
        mappedTarget = [];
    }, this);
    this.push(JSON.stringify(output));
    done();
};

objectFactory.prototype._flush = function (done) {
    done();
};

module.exports = objectFactory;