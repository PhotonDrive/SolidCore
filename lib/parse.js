'use strict';

module.exports = function (inputData, sourceSpecification) {
	return transformRecord(inputData, findRecordType(inputData, sourceSpecification));
};

function findRecordType(inputData, dataSpecification) {
	var recordKey = inputData.substring(dataSpecification.identifierStart, dataSpecification.identifierLength)
	var targetSpecification = dataSpecification.records.filter(function (value) {
		return recordKey === value.identifier;
	});
	if (!targetSpecification[0])
		throw new Error('invalid record - unrecognized');
	else
		return targetSpecification[0];
}

function transformRecord(inputData, recordSpecification) {
	if (!!recordSpecification) {
		if (inputData.length > recordSpecification.length)
			throw new Error('invalid record - record length ' + inputData.length + ' expected length ' + recordSpecification.length );

		var output = {};

		recordSpecification.fields.forEach(function (field) {
			if (inputData.length < field.end)
				throw new Error('field missing: ' + field.Name);

			var value = transformValue(inputData.substring(field.start, field.end).trim(), field);

			if (typeof value === 'string' && value.length === 0 )
				value = '';

			output[field.Name] = value;
		}, output);

		return JSON.stringify(output);
		
	} else {
		throw new Error('invalid record type');
	}
}

function fieldError(message, field, value) {
	if (!message)
		message = 'invalid';
	return new Error(['value is', message, 'for field', field.name, '\n', value].join(' '));
}

function transformValue(value, field) {
	//TODO: Fix this function.
	switch (field.type) {
		case 'string':
			return value;

		case 'integer':
			if (value === null || !value.length)
				return null;
			if (!value.match(/^[0-9]+$/))
				throw fieldError('not an integer', field, value);
			return parseInt(value, 10);

		case 'boolean':
			if (value === '1')
				return true;
			if (value === '0')
				return false;
			if (!value)
				return null;
			throw fieldError('not a boolean', field, value);

		case 'datetime':
			if (value === null || !value.length)
				return value;
			try {
				value = new Date(Date.UTC(
					parseInt(value.substr(0, 4), 10),
					parseInt(value.substr(4, 2), 10) - 1,
					parseInt(value.substr(6, 2), 10),
					parseInt(value.substr(8, 2), 10) || 0,
					parseInt(value.substr(10, 2), 10) || 0));
			} catch (e) {}
			if (!(value instanceof Date) || !value.getTime())
				throw fieldError('not a valid datetime', field, value);
			return value;

		case 'date':
			if (value === null || !value.length)
				return value;
			try {
				value = new Date(Date.UTC(
					parseInt(value.substr(0, 4), 10),
					parseInt(value.substr(4, 2), 10) - 1,
					parseInt(value.substr(6, 2), 10)));
			} catch (e) {}
			if (!(value instanceof Date) || !value.getTime())
				throw fieldError('not a valid date',field, value);
			return value;

		default:
			throw new Error('unrecognized type ' + field.type + ' on field ' + field.name);
	}
}
