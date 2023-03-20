import { mockCorpus3 } from '../../mock-data/corpus';
import { FoundDocument } from '../models';
import { makeContextParams } from './document-context';

describe('document context utils', () => {
    const corpus = mockCorpus3;

    const document: FoundDocument = {
        id: '1',
        relevance: undefined,
        fieldValues: {
            great_field: 'true',
            speech: 'whatever',
            ordering: '42',
            date: '1900-01-01'
        }
    };

    it('should create a document context link', () => {
        const link = makeContextParams(document, corpus);
        expect(link).toEqual({
            date: '1900-01-01:1900-01-01',
            sort: 'ordering,asc'
        });

    });
});
