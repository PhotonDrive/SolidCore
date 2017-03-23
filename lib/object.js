'use strict';

const Transform = require('stream').Transform;
const util = require('util');
const _ = require('lodash');
const maxRecord = '[MAX]';
const codeRecord = "Code_";

function mapObject(options, mapSpecification, executeOnRead) {
    if (!(this instanceof mapObject)) {
        var ofInstance = new mapObject(options, mapSpecification, executeOnRead);
        ofInstance.mapSpecification = mapSpecification;
        if (!!executeOnRead)
            ofInstance.on('readable', executeOnRead);
        return ofInstance;
    }
    Transform.call(this, options);
}
util.inherits(mapObject, Transform);

mapObject.prototype._transform = function (chunk, encoding, done) {
    var data = JSON.parse(chunk.toString());
    var output = this.mapSpecification[this.mapSpecification.TargetElement] ||{};
    if (Array.isArray(data.Record)||false) {
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
                            _.set(output, targetProperty,  record[key.split('*')[0]].trim());
                        } else if (key.indexOf('$') > -1) {
                            var targetValue = key.split('$');
                            var sourceProperty = targetValue[0];
                            if (!!mappedTarget.TargetIncrement) {
                                targetProperty = targetProperty.replace (mappedTarget.TargetIncementProperty+'[0]', mappedTarget.TargetIncementProperty+'['+ mappedTarget.TargetIncementedValue +']');
                            }

                            if (targetValue[1] ===  record[sourceProperty]) {
                                //if (sourceProperty === 'PersonInvolvedType')
                                //    console.log('' + targetProperty + ' Key: ' + key + ' ' + targetValue[2]);
                                _.set(output, targetProperty, targetValue[2].trim());
                            } else if ((targetValue[3] || '') === '!') {
                                _.set(output, targetProperty, '');
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
                                _.set(output, targetProperty, record[key].trim());
                            } else {
                                //console.log ('targetProprty: ' + targetProperty + ' V: ' + key.substr(5));
                                _.set(output, targetProperty, key.substr(5).trim());
                            }
                        }
                    });
                });
            }
            mappedTarget = [];
        }, this);
        this.push(JSON.stringify(output));
    } else {
        this.push(chunk);
    }
    done();
};

mapObject.prototype._flush = function (done) {
    done();
};

module.exports = mapObject;