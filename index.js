'use strict';

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { performance } = require('perf_hooks');
const progress = require('progress');

const xmldir = '/Users/punkish/Projects/zenodeo/data/treatmentsDump';
const xmlfiles = fs.readdirSync(xmldir);
let uniqTags = {};
let uniqTagsAttribs = {};

const t0 = performance.now();

let i = 0;
let j = xmlfiles.length;

// update the progress bar very 100th of the total num of files
const tickInterval = Math.floor(j/100);
const bar = new progress('  processing [:bar] :rate files/sec :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 30,
    total: j
});

for (; i < j; i++) {
    const xml = fs.readFileSync(path.join(xmldir, `${xmlfiles[i]}`), 'utf8');
    const $ = cheerio.load(xml, {
        normalizeWhitespace: true,
        xmlMode: true
    });

    // update progress bar
    if (!(i % tickInterval)) {
        bar.tick(tickInterval);
    }

    $('*')
        .contents()
        .filter((i, e) => { return e.type === 'tag' })
        .map((i, e) => {

            // escape embedded ':' in tagnames
            if (e.name.indexOf(':') !== -1) e.name = e.name.replace(':', '\\:');

            const attribs = Object.keys(e.attribs).sort();

            return [
                
                // only the tag
                e.name, 

                // tag with its attributes
                e.name + '\t' + (attribs.length ? attribs.join(', ') : '-') 
            ]
        })
        .get()
        .forEach((e, i) => {

            if (i % 2) {

                // tags-attributes
                uniqTagsAttribs[ e ] = uniqTagsAttribs[ e ] ? uniqTagsAttribs[ e ] + 1 : 1;
            }
            else {

                // only tags
                uniqTags[ e ] = uniqTags[ e ] ? uniqTags[ e ] + 1 : 1;
            }
             
        });
}

// alphabetically sorted list of only tags
let rep1 = 'tag\tfrequency\n';
Object.keys(uniqTags)
    .sort()
    .forEach(t => { 
        rep1 += `${t}\t${uniqTags[t]}\n` 
    });

fs.writeFileSync('reports/tags.txt', rep1, 'utf8');

// alphabetically sorted list of tags-attributes
let rep2 = 'tag\tattribs\tfrequency\n';
Object.keys(uniqTagsAttribs)
    .sort()
    .forEach(t => { rep2 += `${t}\t${uniqTagsAttribs[t]}\n` });

fs.writeFileSync('reports/tags-attributes.txt', rep2, 'utf8');

const t1 = performance.now();
console.log(`extracted unique tags from ${j} files in ${(t1 - t0).toFixed(2)} ms`);