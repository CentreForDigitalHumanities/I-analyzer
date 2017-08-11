import { TestBed, inject, fakeAsync } from '@angular/core/testing';

import { ApiService } from './api.service';
import { CorpusService } from './corpus.service';

describe('CorpusService', () => {
  let service: CorpusService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useClass: ApiServiceMock }, CorpusService]
    });
    service = TestBed.get(CorpusService);
  });

  it('should be created', inject([CorpusService], (service: CorpusService) => {
    expect(service).toBeTruthy();
  }));

  it('should parse the list of corpora', () => {
    ApiServiceMock.fakeResult = {
      "dutchbanking": {
        "es_doctype": "article",
        "es_index": "dutchbank",
        "es_settings": null,
        "fields": [],
        "max_date": { "day": 31, "hour": 0, "minute": 0, "month": 12, "year": 2010 },
        "min_date": { "day": 1, "hour": 0, "minute": 0, "month": 1, "year": 1785 }
      },
      "times": {
        "es_doctype": "article",
        "es_index": "times",
        "es_settings": null,
        "fields": [],
        "max_date": { "day": 31, "hour": 0, "minute": 0, "month": 12, "year": 2010 },
        "min_date": { "day": 1, "hour": 0, "minute": 0, "month": 1, "year": 1785 }
      },
    };
    service.get().then((items) => {
      expect(items.map(item => item.name)).toEqual(['dutchbanking', 'times']);
    });
  });

  it('should parse filters', () => {
    ApiServiceMock.fakeResult = {
      "times": {
        "es_doctype": "article",
        "es_index": "times",
        "es_settings": null,
        "max_date": { "day": 31, "hour": 0, "minute": 0, "month": 12, "year": 2010 },
        "min_date": { "day": 1, "hour": 0, "minute": 0, "month": 1, "year": 1785 },
        "fields": [{
          "description": "Banking concern to which the report belongs.",
          "es_mapping": { "type": "keyword" },
          "hidden": true,
          "indexed": false,
          "name": "bank",
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
      expect(items).toEqual([{
        name: 'times',
        fields: [{
          description: "Banking concern to which the report belongs.",
          hidden: true,
          name: 'bank',
          type: 'keyword',
          searchFilter: {
            description: "Search only within these banks.",
            name: "MultipleChoiceFilter",
            options: ['A', 'B', 'C']
          }
        }, {
          description: "Year of the financial report.",
          hidden: false,
          name: 'year',
          type: 'integer',
          searchFilter: {
            description: "Restrict the years from which search results will be returned.",
            name: "RangeFilter",
            lower: 1785,
            upper: 2010
          }
        }
        ],
        minDate: new Date(1785, 0, 0, 0, 0),
        maxDate: new Date(2010, 11, 30, 0, 0),
      }]);
    });
  });
});

class ApiServiceMock {
  static fakeResult: any;

  public get(): Promise<any> {
    return Promise.resolve(ApiServiceMock.fakeResult);
  }
}
