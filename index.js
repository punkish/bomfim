'use strict';

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const progress = require('progress');
const { performance } = require('perf_hooks');

// Coded by @mguidoti
const MG = require('./attr');

const xmldir = '/Users/punkish/Projects/zenodeo/data/treatmentsDump';
const xmlfiles = fs.readdirSync(xmldir);

let uniqTags = {};
let uniqTagsAttribs = {};
let uniqTagsAttribsPairs = {};
let treatmentIDs = {};

let resultingHash = {};

const t0 = performance.now();

let i = 0;
let j = xmlfiles.length;
j = 10;

// update the progress bar every 10% of the total num of files
const tickInterval = Math.floor( j / (j * 0.10) );
const bar = new progress('  processing [:bar] :rate files/sec :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 30,
    total: j
});

for (; i < j; i++) {

    const treatmentID = xmlfiles[i].split('.')[0];

    const $ = cheerio.load(fs.readFileSync(path.join(xmldir, `${xmlfiles[i]}`), 'utf8'), {
        normalizeWhitespace: true,
        xmlMode: true
    });

    // update progress bar every tickInterval
    if (!(i % tickInterval)) {
        bar.tick(tickInterval)
    }

    $('*')
        .contents()
        .filter((i, e) => { return e.type === 'tag' })
        .map((i, e) => {

            const tag = e.name;
            const attribs = Object.keys(e.attribs).sort();
            let attributesList;
            let tagAttribsPairs = [];

            if (attribs.length) {
                attributesList = attribs.join(',');

                // tag and attribute pairs
                attribs.forEach(attrib => {
                    tagAttribsPairs.push([tag, attrib]);
                })
            }
            else {

                // if there are no attributes, we default the output to '-'
                attributesList = 'no attributes';

                // tag and attribute pairs
                tagAttribsPairs.push([tag, 'no attributes']);
            }

            const tagAttribs = tag + '\t' + attributesList;

            // create a tagAttribsPairsStr by joining the tagAttribsPairs 
            // with a '*'
            const tagAttribsPairsStr = tagAttribsPairs.join('*');

            // Composes the desired display of the key: <tag attr="value">
            // As we're always looking for a "type" attribute, e.attribs.type 
            // works just fine
            // let composedKey;
            // if (e.attribs.type) {
            //     composedKey = `<${e.name} type="${e.attribs.type}">`;
            //     resultingHash[ composedKey ] = resultingHash[ composedKey ] ? resultingHash[ composedKey ] + 1 : 1;
            // }
            MG.attr(resultingHash, e);

            // Store the name of the file (really the treatmentID) keyed 
            // by the unique tags or tagAttribs or tagAttribsPairsStr
            treatmentIDs[tag] = treatmentID;
            treatmentIDs[tagAttribs] = treatmentID;
            treatmentIDs[tagAttribsPairsStr] = treatmentID;

            // if the return value in cheerio's .map() is an array, the value
            // seems to get flattened into a comma-separated list. So, to 
            // maintain the unique values, we make a string delimiting the  
            // values with a '|'
            return tag + '|' + tagAttribs + '|' + tagAttribsPairsStr;
        })
        .get()
        .forEach((e, i) => {
            
            // split the string on '|' to get back the separate values 
            // returned from .map (see above)
            const [tag, tagAttribs, tagAttribsPairsStr] = e.split('|');

            // calculate frequency of occurance
            uniqTags[ tag ] = uniqTags[ tag ] ? uniqTags[ tag ] + 1 : 1;
            uniqTagsAttribs[ tagAttribs ] = uniqTagsAttribs[ tagAttribs ] ? uniqTagsAttribs[ tagAttribs ] + 1 : 1;

            // frequency of tag-attribute pairs is trickier because one 
            // tag can generate many pairs. So we store the frequency and 
            // the name of the file in an array. That way we can extact
            // these values later
            const xml = treatmentIDs[tagAttribsPairsStr];
            tagAttribsPairsStr.split('*').forEach(ta => {
                
                if (uniqTagsAttribsPairs[ ta ]) {
                    uniqTagsAttribsPairs[ ta ] = [uniqTagsAttribsPairs[ ta ][0] + 1, xml];
                }
                else {
                    uniqTagsAttribsPairs[ ta ] = [1, xml];
                }

            })
             
        });
}

// alphabetically sorted list of only tags
let headers = ['tag', 'xml', 'frequency'];
let rep = headers.join('\t') + '\n';
Object.keys(uniqTags)
    .sort()
    .forEach(tag => {

        const row = [tag, treatmentIDs[tag], uniqTags[tag]];
        rep += row.join('\t') + '\n';

    });

fs.writeFileSync('reports/tags.tsv', rep, 'utf8');

// alphabetically sorted list of tags-attributes
headers = ['tag', 'attributes', 'xml', 'frequency'];
rep = headers.join('\t') + '\n';
Object.keys(uniqTagsAttribs)
    .sort()
    .forEach(tagAttribs => { 
        
        const row = [tagAttribs, treatmentIDs[tagAttribs], uniqTagsAttribs[tagAttribs]];
        rep += row.join('\t') + '\n';

    });

fs.writeFileSync('reports/tags-attributes.tsv', rep, 'utf8');

// alphabetically sorted list of tags-attributes
headers = ['tag', 'attributes', 'xml', 'frequency'];
rep = headers.join('\t') + '\n';
Object.keys(uniqTagsAttribsPairs)
    .sort()
    .forEach(t => { 
        
        const [tag, attribute] = t.split(',');
        const [freq, xml] = [ uniqTagsAttribsPairs[t][0], uniqTagsAttribsPairs[t][1] ];
        const row = [tag, attribute, freq, xml];
        rep += row.join('\t') + '\n'; 

    });

fs.writeFileSync('reports/tagAttribute-pairs.tsv', rep, 'utf8');

headers = ['tag with attr="type"', 'frequency'];
rep = headers.join('\t') + '\n';

Object.keys(resultingHash)
    .sort()
    .forEach(t => {

        const row = [t, resultingHash[t]]
        rep += row.join('\t') + '\n'; 
    });

fs.writeFileSync('reports/variance-on-attr-type.tsv', rep, 'utf8');
const t1 = performance.now();
console.log(`extracted unique tags from ${j} files in ${(t1 - t0).toFixed(2)} ms`);