import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

import { ApiService } from './api.service';
import { SearchFilterData, SearchSample } from '../models/index';


@Injectable()
export class SearchService {
    private results = new Subject<Array<Hit>>();

    // Observable string streams
    results$ = this.results.asObservable();

    constructor(private apiService: ApiService) { }

    public search(corpusName: string, query: string = '', fields: string[] = [], filters: SearchFilterData[] = []): Promise<SearchSample> {
        return this.apiService.search({ corpusName, query: query, fields, filters: filters, n: null, resultType: 'json' })
            .then(result => {
                let table = result.table;
                let records = table;
                let fields: string[] = records[0];
                let hits: Hit[] = [];
                for (let i = 1; i < records.length; i++) {
                    let hit: Hit = {};
                    for (let j = 0; j < fields.length; j++) {
                        hit[fields[j]] = records[i][j];
                    }
                    hits.push(hit);

                }

                return <SearchSample>{
                    total: result.total,
                    fields,
                    hits
                };
            });
    }

    public searchAsCsv(corpusName: string, query: string = '', fields: string[] = [], filters: SearchFilterData[] = []): Promise<boolean> {
        let form: HTMLFormElement;
        return this.apiService.getSearchCsvUrl().then(url => {
            form = document.createElement('form');
            document.body.appendChild(form);
            form.method = 'post';
            form.target = 'csv';
            form.action = url;

            let createInput = (name: string, value: string) => {
                let input = document.createElement('input');
                input.type = 'hidden';
                input.name = name;
                input.value = value;
                return input;
            };

            form.appendChild(createInput('corpus_name', corpusName));
            form.appendChild(createInput('query', query));
            form.appendChild(createInput('fields', JSON.stringify(fields)));
            form.appendChild(createInput('filters', JSON.stringify(filters)));

            form.submit();

            document.body.removeChild(form);
            form = undefined;

            return true;
        });
    }

    public searchForVisualization(corpusName: string, query: string = '', fields: string[] = [], filters: SearchFilterData[] = []): Promise<boolean> {
        // search n results for visualization
        let n = 10000;
        return this.apiService.search()
            .then(result => {
                let table = result.table;
                let records = table;
                let fields: string[] = records[0];
                let hits: Hit[] = [];
                for (let i = 1; i < records.length; i++) {
                    let hit: Hit = {};
                    for (let j = 0; j < fields.length; j++) {
                        hit[fields[j]] = records[i][j];
                    }
                    hits.push(hit);

                }

                this.results.next(hits);

                return true;
            });
    }
}

type Hit = { [fieldName: string]: string };
