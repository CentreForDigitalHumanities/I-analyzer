/* eslint-disable @typescript-eslint/naming-convention */
import { BehaviorSubject } from 'rxjs';
import { findByName } from '../app/utils/utils';
import { BooleanFilterOptions } from '../app/models/field-filter-options';
import { Corpus, CorpusField } from '../app/models';

export const keywordFieldFactory = (searchable = false): CorpusField => {
    const mapping = searchable ?
        { type: 'keyword', fields: { text: { type: 'text'}}} :
        { type: 'keyword'};
    return new CorpusField({
        name: 'genre',
        description: 'Genre of the document',
        display_name: 'Genre',
        display_type: 'keyword',
        es_mapping: mapping,
        hidden: false,
        searchable,
        downloadable: true,
        search_filter: {
            name: 'MultipleChoiceFilter',
            option_count: 10,
            description: 'Select genre',
        },
        results_overview: true,
        search_field_core: false,
        csv_core: true,
        visualizations: ['resultscount', 'termfrequency'],
        visualization_sort: '',
        language: '',
        sortable: false,
        indexed: true,
        required: false,
    });
};

export const contentFieldFactory = (): CorpusField =>
    new CorpusField({
        name: 'content',
        description: 'Text of the document',
        display_name: 'Content',
        display_type: 'text_content',
        es_mapping: {
            type: 'text',
            term_vector: 'with_positions_offsets',
            fields: {
                length: { type: 'token_count', analyzer: 'standard' },
                clean: { type: 'text', analyzer: 'clean_en', term_vector: 'with_positions_offsets' },
                stemmed: { type: 'text', analyzer: 'stemmed_en', term_vector: 'with_positions_offsets' },
            },
        },
        hidden: false,
        sortable: false,
        searchable: true,
        downloadable: true,
        search_filter: null,
        results_overview: true,
        search_field_core: true,
        csv_core: true,
        visualizations: ['wordcloud', 'ngram'],
        visualization_sort: null,
        indexed: true,
        required: false,
        language: 'eng',
    });


export const dateFieldFactory = () =>
    new CorpusField({
        name: 'date',
        display_name: 'Date',
        description: 'Publication date for the document',
        display_type: 'date',
        hidden: false,
        sortable: true,
        searchable: false,
        downloadable: true,
        search_filter: {
            name: 'DateFilter',
            lower: '1800-01-01',
            upper: '1899-12-31',
            description: 'Select date range for documents'
        },
        es_mapping: {type: 'date'},
        results_overview: true,
        search_field_core: false,
        csv_core: true,
        visualizations: ['resultscount', 'termfrequency'],
        visualization_sort: null,
        indexed: true,
        required: false,
        language: '',
    });


export const intFieldFactory = () =>
    new CorpusField({
        name: 'page',
        display_name: 'Page',
        description: 'Page number of the document',
        display_type: 'integer',
        hidden: false,
        sortable: true,
        downloadable: true,
        search_filter: {
            name: 'RangeFilter',
            lower: 0,
            upper: 100,
            description: 'Select page range',
        },
        es_mapping: { type: 'integer' },
        results_overview: false,
        searchable: false,
        search_field_core: false,
        csv_core: false,
        visualizations: ['resultscount', 'termfrequency'],
        visualization_sort: '',
        indexed: true,
        required: false,
        language: '',
    });

export const booleanFieldFactory = () =>
    new CorpusField({
        name: 'public_domain',
        display_name: 'In public domain',
        description: 'Whether the text is in the public domain',
        display_type: 'boolean',
        hidden: false,
        sortable: false,
        downloadable: true,
        search_filter: {
            name: 'BooleanFilter',
            description: ''
        },
        es_mapping: { type: 'boolean' },
        results_overview: false,
        searchable: false,
        search_field_core: false,
        csv_core: false,
        visualizations: [],
        visualization_sort: '',
        indexed: true,
        required: false,
        language: '',
    });


export const corpusFactory = () =>
    new Corpus(
        'test',
        'Test corpus',
        'A basic corpus for testing',
        'test',
        [
            keywordFieldFactory(),
            contentFieldFactory(),
            dateFieldFactory(),
        ],
        1800,
        1900,
        '',
        true,
        false,
        ['English'],
        'Books',
        false,
        { contextFields: [], displayName: null },
        false,
        [undefined, 'desc'],
    );

const mockFilterOptions: BooleanFilterOptions = {
    name: 'BooleanFilter',
    description: 'Use this filter to decide whether or not this field is great',
};

/** a keyword field with a boolean filter */
export const mockField = new CorpusField({
    name: 'great_field',
    description: 'A really wonderful field',
    display_name: 'Greatest field',
    display_type: 'keyword',
    es_mapping: {type: 'keyword'},
    hidden: false,
    sortable: false,
    searchable: false,
    downloadable: false,
    search_filter: mockFilterOptions,
    results_overview: true,
    search_field_core: true,
    csv_core: true,
    visualizations: [],
    visualization_sort: null,
    indexed: true,
    required: false,
    language: '',
});

/* a keyword field with a multiple choice filter */
export const mockFieldMultipleChoice = new CorpusField({
    name: 'greater_field',
    description: 'A even more wonderful field',
    display_name: 'Greater field',
    display_type: 'keyword',
    es_mapping: {type: 'keyword'},
    hidden: false,
    sortable: false,
    searchable: false,
    downloadable: false,
    search_filter: {
        name: 'MultipleChoiceFilter',
        option_count: 10,
        description: 'Select your favourite values!'
    },
    results_overview: true,
    search_field_core: true,
    csv_core: true,
    visualizations: [],
    visualization_sort: null,
    indexed: true,
    required: false,
    language: '',
});

/** a text content field */
export const mockField2 = new CorpusField({
    name: 'speech',
    description: 'A content field',
    display_name: 'Speechiness',
    display_type: 'text_content',
    es_mapping: {type: 'text'},
    hidden: false,
    sortable: false,
    searchable: true,
    downloadable: true,
    search_filter: null,
    results_overview: true,
    search_field_core: true,
    csv_core: true,
    visualizations: [],
    visualization_sort: null,
    indexed: true,
    required: false,
    language: '',
});

/** a keyword field with sorting option */
export const mockField3 = new CorpusField({
    name: 'ordering',
    description: 'A field which can be sorted on',
    display_name: 'Sort me',
    display_type: 'integer',
    es_mapping: {type: 'keyword'},
    hidden: false,
    sortable: true,
    searchable: false,
    downloadable: true,
    results_overview: true,
    search_filter: {
        name: 'RangeFilter',
        description: 'Filter me',
        lower: 0,
        upper: 100,
    },
    search_field_core: false,
    csv_core: true,
    visualizations: [],
    visualization_sort: null,
    indexed: true,
    required: false,
    language: '',
});

/** a date field */
export const mockFieldDate = new CorpusField({
    name: 'date',
    display_name: 'Date',
    description: '',
    display_type: 'date',
    hidden: false,
    sortable: true,
    searchable: false,
    downloadable: true,
    search_filter: {
        name: 'DateFilter',
        lower: '1800-01-01',
        upper: '1899-12-31',
        description: ''
    },
    es_mapping: {type: 'date'},
    results_overview: true,
    search_field_core: false,
    csv_core: true,
    visualizations: [],
    visualization_sort: null,
    indexed: true,
    required: false,
    language: '',
});


export class CorpusServiceMock {
    private currentCorpusSubject = new BehaviorSubject<Corpus>(corpusFactory());
    // eslint-disable-next-line @typescript-eslint/member-ordering
    public currentCorpus = this.currentCorpusSubject.asObservable();

    public get(refresh = false): Promise<Corpus[]> {
        return Promise.resolve([corpusFactory()]);
    }

    public set(corpusName = 'test1'): Promise<boolean> {
        return this.get().then((all) => {
            const corpus = findByName(all, corpusName);
            if (!corpus) {
                return false;
            } else {
                this.currentCorpusSubject.next(corpus);
                return true;
            }
        });
    }
}
