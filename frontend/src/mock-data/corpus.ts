/* eslint-disable @typescript-eslint/naming-convention */
import { BehaviorSubject } from 'rxjs';
import { findByName } from '../app/utils/utils';
import { BooleanFilterOptions } from '../app/models/search-filter-options';
import { Corpus, CorpusField } from '../app/models';

const mockFilterOptions: BooleanFilterOptions = {
    checked: false,
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
    primary_sort: false,
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
    primary_sort: false,
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
    primary_sort: false,
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
    primary_sort: false,
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
});

/** a date field */
export const mockFieldDate = new CorpusField({
    name: 'date',
    display_name: 'Date',
    description: '',
    display_type: 'date',
    hidden: false,
    sortable: true,
    primary_sort: false,
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
});


export const mockCorpus: Corpus = {
    name: 'test1',
    serverName: 'default',
    index: 'test1',
    title: 'Test corpus',
    description: 'This corpus is for mocking',
    minDate: new Date('1800-01-01'),
    maxDate: new Date('1900-01-01'),
    image: 'test.jpg',
    scan_image_type: 'pdf',
    allow_image_download: false,
    word_models_present: false,
    fields: [mockField, mockField2],
    languages: ['English'],
    category: 'Tests'
} as Corpus;

export const mockCorpus2 = {
    name: 'test2',
    serverName: 'default',
    index: 'test2',
    title: 'Test corpus 2',
    description: 'This corpus is for mocking',
    minDate: new Date('1850-01-01'),
    maxDate: new Date('2000-01-01'),
    image: 'test.jpg',
    scan_image_type: 'pdf',
    allow_image_download: false,
    word_models_present: false,
    fields: [mockField2],
    languages: ['English', 'French'],
    category: 'Different tests'
} as Corpus;

export const mockCorpus3: Corpus = {
    name: 'test3',
    serverName: 'default',
    index: 'test3',
    title: 'Test corpus 3',
    description: 'This corpus is for mocking',
    minDate: new Date(),
    maxDate: new Date(),
    image: 'test.jpg',
    scan_image_type: 'pdf',
    allow_image_download: false,
    word_models_present: false,
    fields: [mockField, mockField2, mockField3, mockFieldDate, mockFieldMultipleChoice],
    languages: ['English'],
    category: 'Tests',
    documentContext: {
        contextFields: [mockFieldDate],
        displayName: 'day',
        sortField: mockField3,
        sortDirection: 'asc'
    }
} as Corpus;

export class CorpusServiceMock {
    private currentCorpusSubject = new BehaviorSubject<Corpus>(mockCorpus);
    public currentCorpus = this.currentCorpusSubject.asObservable();

    public get(refresh=false): Promise<Corpus[]> {
        return Promise.resolve([mockCorpus, mockCorpus2]);
    }

    public set(corpusName='test1'): Promise<boolean> {
        return this.get().then(all => {
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
