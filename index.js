'use strict';

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { performance } = require('perf_hooks');

const xmldir = '/Users/punkish/Projects/zenodeo/data/treatmentsDump';
const xmlFiles = fs.readdirSync(xmldir);
let uniqTags = {};

const t0 = performance.now();

let i = 0;
const j = xmlFiles.length;

for (; i < j; i++) {
    const xml = fs.readFileSync(path.join(xmldir, `${xmlFiles[i]}`), 'utf8');
    const $ = cheerio.load(xml, {
        normalizeWhitespace: true,
        xmlMode: true
    });

    $('*')
        .contents()
        .filter((i, e) => { return e.type === 'tag' })
        .map((i, e) => {
            if (e.name.indexOf(':') !== -1) e.name = e.name.replace(':', '\\:');
            return e.name
        })
        .get()
        .forEach(e => { uniqTags[e] = uniqTags[e] ? uniqTags[e] + 1 : 1 })
}

const t1 = performance.now();
console.log(`extracting unique tags from ${j} files took ${(t1 - t0).toFixed(2)} ms`);
console.log(uniqTags);