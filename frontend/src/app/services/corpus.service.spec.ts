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
import { Fieldset } from 'primeng/primeng';

describe('CorpusService', () => {
    let service: CorpusService;
    let apiServiceMock = new ApiServiceMock();
    let userServiceMock = new UserServiceMock();
    // TODO: validate that this shouldn't be done server-side
    userServiceMock.currentUser.role.corpora.push(...[
        { name: "test1", description: "" },
        { name: "test2", description: "" },
        { name: "times", description: "" },]);

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                ApiRetryService,
                { provide: ApiService, useValue: apiServiceMock },
                CorpusService,
                LogService,
                { provide: UserService, useValue: userServiceMock }]
        });
        service = TestBed.get(CorpusService);
    });

    it('should be created', inject([CorpusService], (service: CorpusService) => {
        expect(service).toBeTruthy();
    }));

    it('should parse the list of corpora', () => {
        apiServiceMock.fakeResult['corpus'] = {
            "test1": {
                "title": "Test 1",
                "description": "Test description 1.",
                "es_doctype": "article",
                "es_index": "test1",
                "es_settings": null,
                "overview_fields": [],
                "fields": [],
                "max_date": { "day": 31, "hour": 0, "minute": 0, "month": 12, "year": 2010 },
                "min_date": { "day": 1, "hour": 0, "minute": 0, "month": 1, "year": 1785 },
                "scan_image_type": "png",
                "allow_image_download": false,
                "word_models_present": false
            },
            "test2": {
                "title": "Test 2",
                "description": "Test description 2.",
                "es_doctype": "article",
                "es_index": "test2",
                "es_settings": null,
                "overview_fields": [],
                "fields": [],
                "max_date": { "day": 31, "hour": 0, "minute": 0, "month": 12, "year": 2010 },
                "min_date": { "day": 1, "hour": 0, "minute": 0, "month": 1, "year": 1785 },
                "scan_image_type": "jpg",
                "allow_image_download": true,
                "word_models_present": true
            },
        };
        service.get().then((items) => {
            expect(items.map(item => item.name)).toEqual(['test1', 'test2']);
        });
    });

    it('should parse filters', () => {
        apiServiceMock.fakeResult['corpus'] = {
            "times": {
                "server_name": "default",
                "title": "Times",
                "description": "This is a description.",
                "es_doctype": "article",
                "es_index": "times",
                "fields": [{
                    "description": "Banking concern to which the report belongs.",
                    "es_mapping": { "type": "keyword" },
                    "hidden": true,
                    "sortable": false,
                    "searchable": true,
                    "downloadable": false,
                    "name": "bank",
                    "display_name": "Bank",
                    "results_overview": false,
                    "csv_core": false,
                    "search_field_core": false,
                    "visualization_type": "term_frequency",
                    "visualization_sort": "key",
                    "search_filter": {
                        "name": "MultipleChoiceFilter",
                        "description": "Search only within these banks.",
                        "fieldName": "bank",
                        "useAsFilter": false,
                        "options_count": 3               
                    }
                },
                {
                    "description": "Year of the financial report.",
                    "es_mapping": { "type": "integer" },
                    "hidden": false,
                    "sortable": true,
                    "searchable": false,
                    "downloadable": true,
                    "name": "year",
                    "results_overview": true,
                    "csv_core": true,
                    "search_field_core": false,
                    "term_frequency": false,
                    "visualization_type": "term_frequency",
                    "visualization_sort": "key",
                    "search_filter": {
                        "name": "RangeFilter",
                        "description": "Restrict the years from which search results will be returned.",
                        "fieldName": "year",
                        "useAsFilter": false,
                        "lower": 1785,
                        "upper": 2010
                    }
                }],
                "min_date": { "day": 1, "hour": 0, "minute": 0, "month": 1, "year": 1785 },
                "max_date": { "day": 31, "hour": 0, "minute": 0, "month": 12, "year": 2010 },
                "image": "/static/no-image.jpg",
                "scan_image_type": "png",
                "allow_image_download": false,
                "word_models_present": true,
            },
        };

        return service.get().then((items) => {
            let mockMultipleChoiceData: SearchFilterData  = {
                filterType: 'MultipleChoiceFilter',
                options: [undefined, undefined, undefined],
                selected: []
            };
            let mockRangeData: SearchFilterData = {
                filterType: 'RangeFilter',
                min: 1785,
                max: 2010
            };
            let allFields: CorpusField[] = [{
                description: "Banking concern to which the report belongs.",
                displayName: 'Bank',
                displayType: 'keyword',
                resultsOverview: false,
                csvCore: false,
                searchFieldCore: false,
                visualizationType: 'term_frequency',
                visualizationSort: "key",
                hidden: true,
                sortable: false,
                searchable: true,
                downloadable: false,
                name: 'bank',
                searchFilter: {
                    description: "Search only within these banks.",
                    fieldName: "bank",
                    useAsFilter: false,
                    defaultData: mockMultipleChoiceData,
                    currentData: mockMultipleChoiceData
                }
            }, {
                description: "Year of the financial report.",
                hidden: false,
                sortable: true,
                searchable: false,
                downloadable: true,
                name: 'year',
                displayName: 'year',
                displayType: 'integer',
                resultsOverview: true,
                csvCore: true,
                searchFieldCore: false,
                visualizationType: 'term_frequency',
                visualizationSort: "key",
                searchFilter: {
                    description: "Restrict the years from which search results will be returned.",
                    fieldName: 'year',
                    useAsFilter: false,
                    defaultData: mockRangeData,
                    currentData: mockRangeData
                }
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