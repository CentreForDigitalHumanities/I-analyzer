import { mockCorpus } from 'mock-data/corpus';
import { searchFieldOptions } from './search-fields';
import { Corpus } from '@models';
import _ from 'lodash';

describe('searchFieldOptions', () => {
    let corpus: Corpus;

    beforeEach(() => {
        corpus = _.cloneDeep(mockCorpus);
    });

    it('should filter searchable fields', () => {
        const options = searchFieldOptions(corpus);
        expect(options.length).toBe(1);
    });

    it('should use text multifields', () => {
        corpus.fields[0].searchable = true;
        corpus.fields[0].multiFields = ['text'];
        const options = searchFieldOptions(corpus);
        expect(options.length).toBe(2);
        expect(options[0].name).toBe('great_field.text');
    });

    it('should include stemmed multifields', () => {
        corpus.fields[1].multiFields = ['length', 'clean', 'stemmed'];
        const options = searchFieldOptions(corpus);
        expect(options.length).toBe(2);
        expect(options[0].name).toBe('speech');
        expect(options[1].name).toBe('speech.stemmed');
    });
});
