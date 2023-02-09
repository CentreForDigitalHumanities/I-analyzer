import { TestBed, inject, fakeAsync } from '@angular/core/testing';

import { ApiServiceMock } from '../../mock-data/api';
import { ApiService } from './api.service';
import { ApiRetryService } from './api-retry.service';
import { CorpusService } from './corpus.service';
import { LogService } from './log.service';
import { UserService } from './user.service';
import { UserServiceMock } from '../../mock-data/user';

import { Corpus } from '../models/corpus';
import { CorpusField, SearchFilterData } from '../models/index';

describe('CorpusService', () => {
    let service: CorpusService;
    const apiServiceMock = new ApiServiceMock();
    const userServiceMock = new UserServiceMock();
    // TODO: validate that this shouldn't be done server-side
    userServiceMock.currentUser.accessibleCorpora.push(
        ...['test1', 'test2', 'times']
    );

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                ApiRetryService,
                { provide: ApiService, useValue: apiServiceMock },
                CorpusService,
                LogService,
                { provide: UserService, useValue: userServiceMock }]
        });
        service = TestBed.inject(CorpusService);
    });

    it('should be created', inject([CorpusService], (corpusService: CorpusService) => {
        expect(corpusService).toBeTruthy();
    }));

    it('should parse the list of corpora', async () => {
        apiServiceMock.fakeResult['corpus'] = {
            test1: {
                title: 'Test 1',
                description: 'Test description 1.',
                es_doctype: 'article',
                es_index: 'test1',
                overview_fields: [],
                fields: [],
                max_date: { day: 31, hour: 0, minute: 0, month: 12, year: 2010 },
                min_date: { day: 1, hour: 0, minute: 0, month: 1, year: 1785 },
                scan_image_type: 'png',
                allow_image_download: false,
                word_models_present: false
            },
            test2: {
                title: 'Test 2',
                description: 'Test description 2.',
                es_doctype: 'article',
                es_index: 'test2',
                overview_fields: [],
                fields: [],
                max_date: { day: 31, hour: 0, minute: 0, month: 12, year: 2010 },
                min_date: { day: 1, hour: 0, minute: 0, month: 1, year: 1785 },
                scan_image_type: 'jpg',
                allow_image_download: true,
                word_models_present: true
            },
        };
        const items = await service.get();
        expect(items.map(item => item.name)).toEqual(['test1', 'test2']);
    });

    it('should parse filters', () => {
        apiServiceMock.fakeResult['corpus'] = {
            times: {
                server_name: 'default',
                title: 'Times',
                description: 'This is a description.',
                es_doctype: 'article',
                es_index: 'times',
                fields: [{
                    description: 'Banking concern to which the report belongs.',
                    es_mapping: { type: 'keyword' },
                    hidden: true,
                    sortable: false,
                    primary_sort: false,
                    searchable: true,
                    downloadable: false,
                    name: 'bank',
                    display_name: 'Bank',
                    results_overview: false,
                    csv_core: false,
                    search_field_core: false,
                    visualizations: ['resultscount', 'termfrequency'],
                    visualization_sort: 'key',
                    search_filter: {
                        name: 'MultipleChoiceFilter',
                        description: 'Search only within these banks.',
                        fieldName: 'bank',
                        useAsFilter: false,
                        option_count: 42
                    }
                },
                {
                    description: 'Year of the financial report.',
                    es_mapping: { type: 'integer' },
                    hidden: false,
                    sortable: true,
                    primary_sort: true,
                    searchable: false,
                    downloadable: true,
                    name: 'year',
                    results_overview: true,
                    csv_core: true,
                    search_field_core: false,
                    histogram: false,
                    visualizations: ['resultscount', 'termfrequency'],
                    visualization_sort: 'key',
                    search_filter: {
                        name: 'RangeFilter',
                        description: 'Restrict the years from which search results will be returned.',
                        fieldName: 'year',
                        useAsFilter: false,
                        lower: 1785,
                        upper: 2010
                    }
                },
                {   // example from people & parliament
                    description: 'The transcribed speech',
                    display_name: 'Speech',
                    display_type: 'text_content',
                    es_mapping: {
                        type: 'text',
                        term_vector: 'with_positions_offsets',
                        analyzer: 'standard',
                        fields: {
                            clean: {
                                type: 'text',
                                analyzer: 'clean',
                                term_vector: 'with_positions_offsets'
                            },
                            stemmed: {
                                type: 'text',
                                analyzer: 'stemmed',
                                term_vector: 'with_positions_offsets'
                            },
                            length: {
                                type: 'token_count',
                                analyzer: 'standard'
                            }
                        }
                    },
                    hidden: false,
                    indexed: true,
                    sortable: false,
                    primary_sort: false,
                    searchable: true,
                    downloadable: true,
                    name: 'speech',
                    results_overview: true,
                    csv_core: false,
                    search_field_core: true,
                    term_frequency: false,
                    visualizations: ['wordcloud', 'ngram'],
                    visualization_sort: null,
                }],
                min_date: { day: 1, hour: 0, minute: 0, month: 1, year: 1785 },
                max_date: { day: 31, hour: 0, minute: 0, month: 12, year: 2010 },
                image: '/static/no-image.jpg',
                scan_image_type: 'png',
                allow_image_download: false,
                word_models_present: true,
            },
        };

        return service.get().then((items) => {
            const mockMultipleChoiceData: SearchFilterData = {
                filterType: 'MultipleChoiceFilter',
                optionCount: 42,
                selected: []
            };
            const mockRangeData: SearchFilterData = {
                filterType: 'RangeFilter',
                min: 1785,
                max: 2010
            };
            const allFields: CorpusField[] = [{
                description: 'Banking concern to which the report belongs.',
                displayName: 'Bank',
                displayType: 'keyword',
                resultsOverview: false,
                csvCore: false,
                searchFieldCore: false,
                visualizations: ['resultscount', 'termfrequency'],
                visualizationSort: 'key',
                multiFields: undefined,
                hidden: true,
                sortable: false,
                primarySort: false,
                searchable: true,
                downloadable: false,
                name: 'bank',
                searchFilter: {
                    description: 'Search only within these banks.',
                    fieldName: 'bank',
                    useAsFilter: false,
                    defaultData: mockMultipleChoiceData,
                    currentData: mockMultipleChoiceData
                },
                mappingType: 'keyword',
            }, {
                description: 'Year of the financial report.',
                hidden: false,
                sortable: true,
                primarySort: true,
                searchable: false,
                downloadable: true,
                name: 'year',
                displayName: 'year',
                displayType: 'integer',
                resultsOverview: true,
                csvCore: true,
                searchFieldCore: false,
                visualizations: ['resultscount', 'termfrequency'],
                visualizationSort: 'key',
                multiFields: undefined,
                searchFilter: {
                    description: 'Restrict the years from which search results will be returned.',
                    fieldName: 'year',
                    useAsFilter: false,
                    defaultData: mockRangeData,
                    currentData: mockRangeData
                },
                mappingType: 'integer',
            }, {
                description: 'The transcribed speech',
                hidden: false,
                sortable: false,
                primarySort: false,
                searchable: true,
                downloadable: true,
                name: 'speech',
                displayName: 'Speech',
                displayType: 'text_content',
                resultsOverview: true,
                csvCore: false,
                visualizations: ['wordcloud', 'ngram'],
                visualizationSort: null,
                multiFields: ['clean', 'stemmed', 'length'],
                searchFilter: null,
                searchFieldCore: true,
                mappingType: 'text',
            }];
            expect(items).toEqual([new Corpus(
                'default',
                'times',
                'Times',
                'This is a description.',
                'article',
                'times',
                allFields,
                new Date(1785, 0, 1, 0, 0),
                new Date(2010, 11, 31, 0, 0),
                '/static/no-image.jpg',
                'png',
                false,
                true
            )]);
        });
    });
});
