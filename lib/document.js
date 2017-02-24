'use strict';

const Transform = require('stream').Transform;
const util = require('util');

function documentFactory(options, AggregatorSpecification, executeOnRead) {
    if (!(this instanceof documentFactory)) {
        var dfInstance = new documentFactory(options, AggregatorSpecification, executeOnRead);
        dfInstance.dataSpecification = AggregatorSpecification;
        dfInstance.dataSpecification.transmitterRecordValue = {};
        dfInstance.dataSpecification.FileSummaryRecordValue = {};
        dfInstance.dataSpecification.currentRecord = dfInstance.dataSpecification.TargetRecordItem;
        dfInstance.dataSpecification.previousTransaction = '';

        if (!!executeOnRead)
            dfInstance.on('readable', executeOnRead);
        return dfInstance;
    }
    Transform.call(this, options);
}
util.inherits(documentFactory, Transform);

documentFactory.prototype._transform = function (chunk, encoding, done) {
    var data = JSON.parse(chunk.toString());
    if ((this.dataSpecification.NewDocumentRecordTypesCurrent.indexOf (data[this.dataSpecification.TargetRecordType]) > -1) && 
        (this.dataSpecification.NewDocumentReportTypesPrevious.indexOf(this.dataSpecification.previousTransaction) > -1)) {
        this.dataSpecification.currentRecord.Record.unshift(this.dataSpecification.transmitterRecordValue);
        this.push(JSON.stringify(this.dataSpecification.currentRecord));
        this.dataSpecification.currentRecord = this.dataSpecification.TargetRecordItem;
    }

	switch (data[this.dataSpecification.TargetRecordType]) {
		case this.dataSpecification.transmitterRecord:
			this.dataSpecification.transmitterRecordValue = data;
            break;

		case this.dataSpecification.FileSummaryRecord:
			this.dataSpecification.FileSummaryRecordValue = data;
            break;

        default:
            this.dataSpecification.currentRecord.Record.push(data);
    }
    this.dataSpecification.previousTransaction = data[this.dataSpecification.TargetRecordType]; 
    done();
};

documentFactory.prototype._flush = function (done) {
    this.dataSpecification.currentRecord.Record.unshift(this.dataSpecification.transmitterRecordValue);
    this.push(JSON.stringify(this.dataSpecification.currentRecord));
    done();
};

module.exports = documentFactory;