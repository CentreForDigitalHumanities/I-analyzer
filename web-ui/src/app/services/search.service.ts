import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { SearchFilterData, SearchSample } from '../models/index';

@Injectable()
export class SearchService {

    constructor(private apiService: ApiService) { }

    public search(corpusName: string, query: string = '', fields: string[] = [], filters: SearchFilterData[] = []): Promise<SearchSample> {
        return this.apiService.post<any>('search', { corpusName, query: query, fields, filters: filters }).then(result => {
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

            let a = <SearchSample>{
                total: result.total,
                fields,
                hits
            };
            console.log(a);
            return a;
        });
    }
}

type Hit = { [fieldName: string]: string };
