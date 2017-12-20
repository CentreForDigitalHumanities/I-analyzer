import { TestBed, inject, fakeAsync } from '@angular/core/testing';

import { ApiServiceMock } from './api.service.mock';
import { ApiService } from './api.service';
import { CorpusService } from './corpus.service';

import { Corpus } from '../models/corpus';
import { CorpusField } from '../models/index';

describe('CorpusService', () => {
    let service: CorpusService;
    let apiServiceMock = new ApiServiceMock();

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: ApiService, useValue: apiServiceMock }, CorpusService]
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
                "min_date": { "day": 1, "hour": 0, "minute": 0, "month": 1, "year": 1785 }
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
                "min_date": { "day": 1, "hour": 0, "minute": 0, "month": 1, "year": 1785 }
            },
        };
        service.get().then((items) => {
            expect(items.map(item => item.name)).toEqual(['test1', 'test2']);
        });
    });

    it('should parse filters', () => {
        apiServiceMock.fakeResult['corpus'] = {
            "times": {
                "title": "Times",
                "description": "This is a description.",
                "es_doctype": "article",
                "es_index": "times",
                "es_settings": null,
                "max_date": { "day": 31, "hour": 0, "minute": 0, "month": 12, "year": 2010 },
                "min_date": { "day": 1, "hour": 0, "minute": 0, "month": 1, "year": 1785 },
                "overview_fields": ["bank", "year"],
                "fields": [{
                    "description": "Banking concern to which the report belongs.",
                    "es_mapping": { "type": "keyword" },
                    "hidden": true,
                    "indexed": false,
                    "name": "bank",
                    "display_name": "Bank",
                    "search_filter": {
                        "description": "Search only within these banks.",
                        "name": "MultipleChoiceFilter",
                        "options": ['A', 'B', 'C']
                    }
                },
                {
                    "description": "Year of the financial report.",
                    "es_mapping": { "type": "integer" },
                    "hidden": false,
                    "indexed": true,
                    "name": "year",
                    "search_filter": {
                        "description": "Restrict the years from which search results will be returned.",
                        "lower": 1785,
                        "name": "RangeFilter",
                        "upper": 2010
                    }
                }]
            },
        };

        return service.get().then((items) => {
            let allFields: CorpusField[] = [{
                description: "Banking concern to which the report belongs.",
                hidden: true,
                name: 'bank',
                displayName: 'Bank',
                displayType: 'keyword',
                searchFilter: {
                    description: "Search only within these banks.",
                    name: "MultipleChoiceFilter",
                    options: ['A', 'B', 'C']
                }
            }, {
                description: "Year of the financial report.",
                hidden: false,
                name: 'year',
                displayName: 'year',
                displayType: 'integer',
                searchFilter: {
                    description: "Restrict the years from which search results will be returned.",
                    name: "RangeFilter",
                    lower: 1785,
                    upper: 2010
                }
            }];
            expect(items).toEqual([new Corpus(
                'times',
                'Times',
                'This is a description.',
                'article',
                'times',
                allFields,
                allFields,
                new Date(1785, 0, 1, 0, 0),
                new Date(2010, 11, 31, 0, 0))
            ]);
        });
    });
});
