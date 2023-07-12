import { mockCorpus } from '../../mock-data/corpus';
import { FoundDocument } from './found-document';

const maxScore = 2.9113607;
const mockResponse = {
    _index: 'troonredes',
    _id: '1994_troonrede',
    _score: 2.9113607,
    _source: {
        date: '1994-09-20',
        id: '1994_troonrede',
        title: 'Troonrede 20 september 1994',
        monarch: 'Beatrix',
        speech_type: 'troonrede',
        content: 'Om op langere termijn de zekerheid te kunnen blijven bieden ' +
            'van een gegarandeerd basispensioen, en om solidaire regelingen bij ' +
            'arbeidsongeschiktheid en werkloosheid in stand te houden, is een ' +
            'kritische toets van het bestaande stelsel nu geboden.'
    },
    highlight: {
        content: [
            '<em>toets</em>'
        ]
    }
};

describe('FoundDocument', () => {
    it('should construct from an elasticsearch response', () => {
        const document = new FoundDocument(mockCorpus, mockResponse, maxScore);

        expect(document.id).toBe('1994_troonrede');
        expect(document.fieldValues['monarch']).toBe('Beatrix');
    });
});
