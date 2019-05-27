'use strict';

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const xmldir = 'C:\\Users\\Marcus\\projects\\work\\plazi\\zenodeo\\data\\treatmentDump2';
const xmlfiles = fs.readdirSync(xmldir);

let i = 0; 
let j = xmlfiles.length;

let resultingHash = {}


for (; i < j; i++) {
    const xml = fs.readFileSync(path.join(xmldir, `${xmlfiles[i]}`), 'utf8');
    const $ = cheerio.load(xml, {
        normalizeWhitespace: true,
        xmlMode: true
    });

    // Creating a cheerio object. The && e.type === 'tag' in the filter conditions is not entirely necessary
    // I kept it there just to guarantee that we're not looking at anything spurious.
    $('*')
        .contents()
        .filter((i, e) => { return (e.name === 'mods:name' || e.name == 'subSubSection') && e.type === 'tag' })
        .map((i, e) => {

            // Composes the desired display of the key: <tag attr="value">
            // As we're always looking for a "type" attribute, e.attribs.type works just fine.
            let composedKey = `<${e.name} type="${e.attribs.type}">`
            resultingHash[ composedKey ] = resultingHash[ composedKey ] ? resultingHash[ composedKey ] + 1 : 1;

        });
}

let fileContent = 'tag+attr="type"\tfrequency\n'

Object.keys(resultingHash).sort().forEach(e => {
    fileContent += `${e}\t${resultingHash[e]}\n`
})

fs.writeFileSync('reports/variance-on-attr-type.txt', fileContent, 'utf8');