import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { saveAs } from 'file-saver';

import { ApiService } from './api.service';
import { ElasticSearchService, FoundDocument } from './elastic-search.service';
import { LogService } from './log.service';
import { QueryService } from './query.service';
import { UserService } from './user.service';
import { Corpus, Query, SearchFilterData, SearchSample } from '../models/index';

@Injectable()
export class SearchService {
    constructor(private apiService: ApiService,
        private elasticSearchService: ElasticSearchService,
        private queryService: QueryService,
        private userService: UserService,
        private logService: LogService) { }

    public async search(corpus: Corpus, query: string = '', fields: string[] = [], filters: SearchFilterData[] = []): Promise<SearchSample> {
        this.logService.info(`Requested flat results for query: ${query}`);
        let result = await this.elasticSearchService.search(corpus, query, filters);

        return <SearchSample>{
            total: result.total,
            fields,
            hits: result.documents
        };
    }

    public searchObservable(corpus: Corpus, query: string = '', fields: string[] = [], filters: SearchFilterData[] = []): Observable<FoundDocument<Hit>> {
        let queryModel = this.elasticSearchService.makeQuery(query, filters);
        let totalTransferred = 0;

        // Log the query to the database
        let q = new Query(query, corpus.name, this.userService.getCurrentUserOrFail().id);
        this.queryService.save(q);
        this.logService.info(`Requested observable results for query: ${query}`);

        // Perform the search and obtain output stream
        return this.elasticSearchService.searchObservable<Hit>(
            corpus, queryModel, this.userService.getCurrentUserOrFail().downloadLimit)
            .map(result => {
                q.transferred = result.retrieved;
                if (result.completed) {
                    q.completed = new Date();
                }
                return result;
            })
            .flatMap(result => result.documents)
            .finally(() => {
                if (!q.completed) {
                    q.aborted = true;
                }
                this.queryService.save(q);
            });
    }

    public async searchAsCsv(corpus: Corpus, query: string = '', fields: string[] = [], filters: SearchFilterData[] = []): Promise<string[]> {
        let totalTransferred = 0;

        this.logService.info(`Requested CSV file for query: ${query}`);

        return new Promise<string[]>((resolve, reject) => {
            let rows: string[] = [];
            this.searchObservable(corpus, query, fields, filters)
                .subscribe(
                document => {
                    let row = this.documentRow(document, fields);
                    rows.push(row.join(','));
                    totalTransferred++;
                },
                (error) => reject(error),
                () => resolve(rows));
        });
    }

    private mapIterator = function*<T, TOut>(iterator: IterableIterator<T>, mapper: (value: T) => TOut) {
        while (true) {
            let result = iterator.next();
            if (result.done) {
                break;
            }
            yield mapper(result.value);
        }
    }

    /**
     * Iterate through some dictionaries and yield for each dictionary the values
     * of the selected fields, in given order.
     */
    private documentRow<T>(document: { [id: string]: T }, fields: string[] = []): string[] {
        return fields.map(field => this.documentFieldValue(document[field]));
    }

    private documentFieldValue(value: any) {
        if (!value) {
            return '';
        }
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        if (value instanceof Date) {
            return value.toISOString().split('T')[0];
        }

        return String(value);
    }
}

type Hit = { [fieldName: string]: string };
