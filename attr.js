'use strict';

module.exports = {
    attr: function(resultingHash, element) {

        // Composes the desired display of the key: <tag attr="value">
        // As we're always looking for a "type" attribute, e.attribs.type 
        // works just fine
        let composedKey;
        if (element.attribs.type) {
            composedKey = `<${element.name} type="${element.attribs.type}">`;
            resultingHash[ composedKey ] = resultingHash[ composedKey ] ? resultingHash[ composedKey ] + 1 : 1;
        }

        return resultingHash;
    }
}
