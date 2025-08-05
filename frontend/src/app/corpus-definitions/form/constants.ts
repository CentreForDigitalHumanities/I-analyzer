import iso6393 from '@freearhey/iso-639-3';
import _ from 'lodash';

export interface Language {
    code: string;
    displayName: string;
    altNames: string;
}


export const collectLanguages = (): Language[] => {
    const DisplayNames = new Intl.DisplayNames(['en'], { type: 'language'});

    const getName = (code: string, altNames: string[]) => {
        const canonical = DisplayNames.of(code);
        if (canonical == code) {
            return altNames[0];
        } else {
            return canonical;
        }
    }

    const groupedByCode = _.groupBy(iso6393, 'code');
    return _.toPairs(groupedByCode).map(([code, values]) => {
        const altNames = values.map(l => l.name);
        const displayName = getName(code, altNames);
        return {
            code,
            displayName,
            altNames: altNames.join(', '),
        }
    });
}
