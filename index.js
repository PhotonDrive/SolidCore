'use strict';
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
const recordFactory = require('./lib/record');
const documentFactory = require('./lib/document');
const objectFactory = require('./lib/object');
const xmlFactory = require('./lib/xml');
const xsltFactory = require('./lib/xslt');

var safe = true;
var source, target, specifications = {};

if (!!argv.specificationFile && fs.existsSync(argv.specificationFile)) {
    specifications = require(argv.specificationFile);
} else {
    console.log('Invalid argument, Missing or Bad specificationFile!');
    safe = false;
}

if (!!argv.inputFile && fs.existsSync(argv.inputFile) && safe) {
    source = fs.createReadStream(argv.inputFile);
} else {
    console.log('Invalid argument, Missing or Bad inputFile!');
    safe = false;
}
if (!!argv.outputFile && safe) {
    target = fs.createWriteStream(argv.outputFile);
} else {
    console.log('Invalid argument, Missing outputFile parameter or Output File already exists!');
    safe = false;
}

if (safe) {
    source.pipe(recordFactory({objectMode: false}, specifications.sourceMap))
    .pipe(documentFactory({objectMode: true}, specifications.documentMap))
    .pipe(objectFactory({objectMode: true}, specifications.targetMap))
    .pipe(xmlFactory({objectMode: true}, specifications.targetMap.TargetElement))
    .pipe(xsltFactory({objectMode: false}, specifications.transformMap))
    .pipe(target);
} else {
    console.log('Usage: ');
    console.log('node index --inputFile ./path/ascii.file --specificationFile ./path/specs.json --outputFile ./path/output.xml');
}