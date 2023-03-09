import { mockField2, mockFieldDate } from '../../mock-data/corpus';
import { Corpus, } from './corpus';
import { QueryModel } from './query';

const corpus: Corpus = {
    name: 'mock-corpus',
    title: 'Mock Corpus',
    serverName: 'default',
    description: '',
    index: 'mock-corpus',
    minDate: new Date('1800-01-01'),
    maxDate: new Date('1900-01-01'),
    image: '',
    scan_image_type: null,
    allow_image_download: true,
    word_models_present: false,
    fields: [
        mockField2,
        mockFieldDate,
    ],
};

describe('QueryModel', () => {
    it('should create', () => {
        const query = new QueryModel(corpus);
        expect(query).toBeTruthy();
    });

    it('should convert to an elasticsearch query', () => {
        const query = new QueryModel(corpus);

        expect(query.toEsQuery()).toEqual({
            query: {
                match_all: {}
            }
        });

        query.setQueryText('test');

    });
});
