import { corpusFactory, keywordFieldFactory } from 'mock-data/corpus';
import { searchFieldOptions } from './search-fields';
import { Corpus } from '@models';
import _ from 'lodash';

describe('searchFieldOptions', () => {
    let corpus: Corpus;

    beforeEach(() => {
        corpus = corpusFactory();
    });

    it('should filter searchable fields', () => {
        const options = searchFieldOptions(corpus);
        expect(options.length).toBe(2);
        expect(options).not.toContain(corpus.fields[0]);
        expect(options).toContain(corpus.fields[1]);
    });

    it('should use text multifields', () => {
        corpus.fields[0] = keywordFieldFactory(true);
        const options = searchFieldOptions(corpus);
        expect(options.length).toBe(3);
        expect(options[0].name).toBe('genre.text');
    });

    it('should include stemmed multifields', () => {
        const options = searchFieldOptions(corpus);
        expect(options.length).toBe(2);
        expect(options[0].name).toBe('content');
        expect(options[1].name).toBe('content.stemmed');
    });
});
