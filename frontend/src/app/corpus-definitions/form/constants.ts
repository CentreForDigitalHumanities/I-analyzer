import iso6393 from '@freearhey/iso-639-3';
import _ from 'lodash';

export interface Language {
    code: string;
    displayName: string;
    altNames: string;
}

const DisplayNames = new Intl.DisplayNames(['en'], { type: 'language'});

/** get the display name for a language
 *
 * Used to get a single name for several language items with the same ISO code. This uses
 * Intl.DisplayNames to get a canonical name, if available. Otherwise, picks the first
 * of the listed names.
 */
const getDisplayName = (code: string, altNames: string[]) => {
    const canonical = DisplayNames.of(code);
    // For obscure languages, Intl.DisplayNames.of will just return the code as-is
    if (canonical == code) {
        return altNames[0];
    } else {
        return canonical;
    }
}

export const collectLanguages = (): Language[] => {
    const groupedByCode = _.groupBy(iso6393, 'code');
    return _.toPairs(groupedByCode).map(([code, values]) => {
        const altNames = values.map(l => l.name);
        const displayName = getDisplayName(code, altNames);
        return {
            code,
            displayName,
            altNames: altNames.join(', '),
        }
    });
}
