import { mockField, mockField2, mockField3 } from '../../mock-data/corpus';
import { Corpus, CorpusField, FoundDocument } from '../models';
import { makeContextParams } from './document-context';

describe('document context utils', () => {
    const dateField: CorpusField = {
        name: 'date',
        displayName: 'Date',
        displayType: 'date',
        mappingType: 'date',
        description: '',
        searchable: false,
        sortable: true,
        hidden: false,
        downloadable: true,
        primarySort: false,
        searchFilter: {
            fieldName: 'date',
            description: '',
            useAsFilter: false,
            currentData: {
                filterType: 'DateFilter',
                min: '1800-01-01',
                max: '1900-01-01'
            }
        },
    };

    const corpus: Corpus = {
        name: 'mock-corpus',
        title: 'Mock corpus',
        serverName: 'default',
        description: '',
        index: 'mock-corpus',
        minDate: new Date('1800-01-01'),
        maxDate: new Date('1900-01-01'),
        image: '',
        scan_image_type: '',
        allow_image_download: true,
        word_models_present: false,
        documentContext: {
            contextFields: [dateField],
            displayName: 'edition',
            sortField: mockField3,
            sortDirection: 'asc',
        },
        fields: [
            mockField,
            mockField2,
            mockField3,
            dateField,
        ],
        languages: ['English'],
        category: 'Tests',
    } as Corpus;

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
        const params = makeContextParams(document, corpus);

        expect(params).toEqual({
            date: '1900-01-01:1900-01-01',
            sort: 'ordering,asc'
        });
    });
});
