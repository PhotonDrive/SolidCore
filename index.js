'use strict';
const fs = require('fs');
const colors = require('colors');
const progress = require('cli-progress');
const argv = require('minimist')(process.argv.slice(2));
const recordFactory = require('./lib/record');
const objectFactory = require('./lib/object');
const xmlFactory = require('./lib/xml');
const xsltFactory = require('./lib/xslt');
const parentFactory = require('./lib/parent');
var documentFactory = require('./lib/document');

var bar = new progress.Bar();
var safe = true, source, target, specifications = {}, log = console.log;
console.log = function () {
    var firstParameter = arguments[0];
    var otherParameters = Array.prototype.slice.call(arguments, 1);

    function formatConsoleDate(date) {
        var hour = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();
        var milliseconds = date.getMilliseconds();

        return ('[' + ((hour < 10) ? '0' + hour : hour) + ':' +
            ((minutes < 10) ? '0' + minutes : minutes) + ':' +
            ((seconds < 10) ? '0' + seconds : seconds) + '.' +
            ('00' + milliseconds).slice(-3) + '] ').green;
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
        bar.update(10);
        //console.log('Stage 1 Reading file: '.yellow + argv.inputFile.blue);
    });
} else {
    console.log('Invalid argument, Missing or Bad inputFile!'.red);
    safe = false;
}

if (!!argv.outputFile && safe) {
    target = fs.createWriteStream(argv.outputFile);
    target.on('finish', function () {
        bar.update(199);
        fs.unlinkSync('stage1.xml');
        bar.update(200);
        bar.stop();
        console.log('Stage 2 Completed Successfully!'.green + ' Output File: '.yellow + argv.outputFile.blue);
    });
} else {
    console.log('Invalid argument, Missing outputFile parameter or Output File already exists!'.red);
    safe = false;
}

if (safe) {
    console.log('Stage 1 started Input File: '.yellow + argv.inputFile.blue + ' Specification File: '.yellow + specifications.documentSource.blue);
    bar.start(200, 0);
    if (!!specifications.documentSource) {
        bar.update(30);
        //console.log('Stage 1 Using specifications: '.yellow + specifications.documentSource.blue);
        documentFactory = require(specifications.documentSource);
    }
    var tempXMLFile = fs.createWriteStream('stage1.xml');
    tempXMLFile.on('finish', function () {
        bar.update(100);
        //console.log('Stage 1 Completed Successfully!'.green);
        //console.log('Stage 2 Started, File: stage1.xml'.yellow);
        xsltFactory({}, specifications.transformMap).transform('stage1.xml', {}, function(data) {
            bar.update(170);
            target.write(data);
            target.end('');
        });
    });
    source.pipe(recordFactory({ objectMode: false }, specifications.sourceMap), function() {bar.update(40);})
          .pipe(documentFactory({ objectMode: true }, specifications.documentMap), function() {bar.update(50);})
          .pipe(objectFactory({ objectMode: true }, specifications.targetMap), function() {bar.update(60);})
          .pipe(xmlFactory({ objectMode: true }, specifications.targetMap.TargetElement), function() {bar.update(80);})
          .pipe(parentFactory({ objectMode: false }, specifications.parentMap))
          .pipe(tempXMLFile);
} else {
    console.log('Usage: ');
    console.log('node index --inputFile ./path/ascii.file --specificationFile ./path/specs.json --outputFile ./path/output.xml');
}