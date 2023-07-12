import { makeDocument } from '../../mock-data/constructor-helpers';
import { mockCorpus3 } from '../../mock-data/corpus';
import { makeContextParams } from './document-context';

describe('document context utils', () => {
    const corpus = mockCorpus3;

    const document = makeDocument({
        great_field: 'true',
        speech: 'whatever',
        ordering: '42',
        date: '1900-01-01'
    });

    it('should create a document context link', () => {
        const params = makeContextParams(document, corpus);
        expect(params).toEqual({
            date: '1900-01-01:1900-01-01',
            sort: 'ordering,asc'
        });
    });
});
