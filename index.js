'use strict';

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { performance } = require('perf_hooks');
const progress = require('progress');

const xmldir = '/Users/punkish/Projects/zenodeo/data/treatmentsDump';
const xmlfiles = fs.readdirSync(xmldir);
let uniq = {};

const t0 = performance.now();

let i = 0;
const j = xmlfiles.length;

const bar = new progress('  processing [:bar] :rate fps :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: j
});

for (; i < j; i++) {
    const xml = fs.readFileSync(path.join(xmldir, `${xmlfiles[i]}`), 'utf8');
    const $ = cheerio.load(xml, {
        normalizeWhitespace: true,
        xmlMode: true
    });

    if (!(j % Math.floor(j/10))) {
        bar.tick();
    }

    $('*')
        .contents()
        .filter((i, e) => { return e.type === 'tag' })
        .map((i, e) => {

            // escape embedded ':' in tagnames
            if (e.name.indexOf(':') !== -1) e.name = e.name.replace(':', '\\:');
            return e.name
        })
        .get()
        .forEach(e => { uniq[e] = uniq[e] ? uniq[e] + 1 : 1 });
}

// print an alphabetically sorted list of tags
const uniqfmt = [];
Object.keys(uniq)
    .sort()
    .forEach(t => { uniqfmt.push({tag: t, freq: uniq[t]}) });

console.table(uniqfmt);

const t1 = performance.now();
console.log(`extracted unique tags from ${j} files in ${(t1 - t0).toFixed(2)} ms`);