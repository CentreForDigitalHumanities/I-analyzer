import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { ApiService } from './api.service';
import { ElasticSearchService, Hit, FoundDocument, SearchResult } from './elastic-search.service';
import { LogService } from './log.service';
import { QueryService } from './query.service';
import { UserService } from './user.service';
import { Corpus, CorpusField, Query, SearchFilterData, SearchSample } from '../models/index';

@Injectable()
export class SearchService {
    constructor(private apiService: ApiService,
        private elasticSearchService: ElasticSearchService,
        private queryService: QueryService,
        private userService: UserService,
        private logService: LogService) {
    }

    public async search(corpus: Corpus, query: string = '', fields: CorpusField[] = [], filters: SearchFilterData[] = []): Promise<SearchSample> {
        this.logService.info(`Requested flat results for query: ${query}`);
        let result = await this.elasticSearchService.search(corpus, query, filters);

        return <SearchSample>{
            total: result.total,
            fields,
            hits: result.documents
        };
    }

    public searchObservable(corpus: Corpus, queryText: string = '', fields: CorpusField[] = [], filters: SearchFilterData[] = []): Observable<SearchResult<Hit>> {
        let queryModel = this.elasticSearchService.makeQuery(queryText, filters);
        let completed = false;
        let totalTransferred = 0;

        // Log the query to the database
        let query = new Query(queryModel, corpus.name, this.userService.getCurrentUserOrFail().id);
        let querySave = this.queryService.save(query, true);
        this.logService.info(`Requested observable results for query: ${queryText}`);

        // Perform the search and obtain output stream
        return this.elasticSearchService.searchObservable<Hit>(
            corpus, queryModel, this.userService.getCurrentUserOrFail().downloadLimit)
            .map(result => {
                totalTransferred = result.retrieved;
                if (result.completed) {
                    completed = true;
                }
                return result;
            })
            .finally(() => {
                querySave.then((savedQuery) => {
                    // update the last saved query object, it might have changed on the server
                    if (!completed) {
                        savedQuery.aborted = true;
                    }
                    savedQuery.transferred = totalTransferred;

                    this.queryService.save(savedQuery, undefined, completed);
                });
            });
    }

    public async searchForVisualization(corpus: Corpus, query: string = '', fields: string[] = [], filters: SearchFilterData[] = []): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {

        });
    }

    public async searchAsCsv(corpus: Corpus, query: string = '', fields: CorpusField[] = [], filters: SearchFilterData[] = [], separator = ','): Promise<string[]> {
        let totalTransferred = 0;

        this.logService.info(`Requested CSV file for query: ${query}`);

        return new Promise<string[]>((resolve, reject) => {
            let rows: string[] = [];
            this.searchObservable(corpus, query, fields, filters)
                .subscribe(
                result => {
                    rows.push(...
                        result.documents.map(document =>
                            this.documentRow(document, fields.map(field => field.name))
                                .map(this.csvCell).join(separator) + '\n'));

                    totalTransferred = result.retrieved;
                },
                (error) => reject(error),
                () => resolve(rows));
        });
    }

    private csvCell(value: string) {
        if (value.indexOf('"') >= 0) {
            return `"${value.replace('"', '""')}"`;
        }

        return value;
    }

    /**
     * Iterate through some dictionaries and yield for each dictionary the values
     * of the selected fields, in given order.
     */
    private documentRow<T>(document: { [id: string]: T }, fieldNames: string[] = []): string[] {
        return fieldNames.map(field => this.documentFieldValue(document[field]));
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
