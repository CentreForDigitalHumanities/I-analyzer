import { Corpus, CorpusField } from './corpus';
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
        new CorpusField({
            name: 'content',
            display_name: 'Content',
            display_type: 'text_content',
            description: '',
            hidden: false,
            sortable: false,
            searchable: true,
            downloadable: true,
            primary_sort: false,
            search_filter: null,
            es_mapping: { type: 'text'},
            search_field_core: true,
            visualizations: [],
            visualization_sort: null,
            results_overview: true,
            csv_core: true,
            indexed: true,
            required: false,
        }),
        new CorpusField({
            name: 'date',
            display_name: 'Date',
            display_type: 'date',
            description: '',
            hidden: false,
            sortable: true,
            searchable: false,
            downloadable: true,
            primary_sort: false,
            search_filter: {
                name: 'DateFilter',
                lower: '1800-01-01',
                upper: '1900-01-01',
                description: '',
            },
            es_mapping: { type: 'date'},
            search_field_core: true,
            visualizations: [],
            visualization_sort: null,
            results_overview: true,
            csv_core: true,
            indexed: true,
            required: false,
        }),
    ],
};

describe('QueryModel', () => {
    it('should create', () => {
        const query = new QueryModel(corpus);
        expect(query).toBeTruthy();
    });
});
