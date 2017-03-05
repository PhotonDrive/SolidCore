'use strict';
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
const recordFactory = require('./lib/record');
const objectFactory = require('./lib/object');
const xmlFactory = require('./lib/xml');
const xsltFactory = require('./lib/xslt');
const parentFactory = require('./lib/parent');
var documentFactory = require('./lib/document');

var safe = true, source, target, specifications = {}, log = console.log;
console.log = function () {
    var firstParameter = arguments[0];
    var otherParameters = Array.prototype.slice.call(arguments, 1);

    function formatConsoleDate(date) {
        var hour = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();
        var milliseconds = date.getMilliseconds();

        return '[' + ((hour < 10) ? '0' + hour : hour) + ':' +
            ((minutes < 10) ? '0' + minutes : minutes) + ':' +
            ((seconds < 10) ? '0' + seconds : seconds) + '.' +
            ('00' + milliseconds).slice(-3) + '] ';
    }

    log.apply(console, [formatConsoleDate(new Date()) + firstParameter].concat(otherParameters));
};

if (!!argv.specificationFile && fs.existsSync(argv.specificationFile)) {
    specifications = require(argv.specificationFile);
} else {
    console.log('Invalid argument, Missing or Bad specificationFile!');
    safe = false;
}

if (!!argv.inputFile && fs.existsSync(argv.inputFile) && safe) {
    source = fs.createReadStream(argv.inputFile);
    source.once('data', function () {
        console.log('Stage 1 Reading file: ' + argv.inputFile);
    });
} else {
    console.log('Invalid argument, Missing or Bad inputFile!');
    safe = false;
}

if (!!argv.outputFile && safe) {
    target = fs.createWriteStream(argv.outputFile);
    target.on('finish', function () {
        console.log('Stage 2 Completed Successfully! Output File: ' + argv.outputFile);
        fs.unlinkSync('stage1.xml');
    });
} else {
    console.log('Invalid argument, Missing outputFile parameter or Output File already exists!');
    safe = false;
}

if (safe) {
    console.log('Stage 1 started');
    if (!!specifications.documentSource) {
        console.log('Stage 1 Using specifications: ' + specifications.documentSource);
        documentFactory = require(specifications.documentSource);
    }
    var tempXMLFile = fs.createWriteStream('stage1.xml');
    tempXMLFile.on('finish', function () {
        console.log('Stage 1 Completed Successfully!');
        console.log('Stage 2 Started, File: stage1.xml');
        xsltFactory({}, specifications.transformMap).transform('stage1.xml', {}, function(data) {
            target.write(data);
            target.end('');
        });
    });

    source.pipe(recordFactory({ objectMode: false }, specifications.sourceMap))
          .pipe(documentFactory({ objectMode: true }, specifications.documentMap))
          .pipe(objectFactory({ objectMode: true }, specifications.targetMap))
          .pipe(xmlFactory({ objectMode: true }, specifications.targetMap.TargetElement))
          .pipe(parentFactory({ objectMode: false }, specifications.parentMap))
          .pipe(tempXMLFile);
} else {
    console.log('Usage: ');
    console.log('node index --inputFile ./path/ascii.file --specificationFile ./path/specs.json --outputFile ./path/output.xml');
}