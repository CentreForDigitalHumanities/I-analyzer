import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/finally';
import 'rxjs/add/operator/map';

import { ApiService } from './api.service';
import { ElasticSearchService } from './elastic-search.service';
import { LogService } from './log.service';
import { QueryService } from './query.service';
import { UserService } from './user.service';
import { Corpus, CorpusField, Query, QueryModel, SearchFilterData, searchFilterDataToParam, SearchResults, AggregateResults } from '../models/index';

@Injectable()
export class SearchService {
    constructor(private apiService: ApiService,
        private elasticSearchService: ElasticSearchService,
        private queryService: QueryService,
        private userService: UserService,
        private logService: LogService) {
    }

    /**
     * Loads more results and returns an object containing the existing and newly found documents.
     */
    public async loadMore(corpus: Corpus, existingResults: SearchResults): Promise<SearchResults> {
        this.logService.info(`Requested additional results for: ${JSON.stringify(existingResults.queryModel)}`);
        let results = await this.elasticSearchService.loadMore(corpus, existingResults);
        return this.limitResults(results);
    }

    public makeQueryModel(queryText: string = '', filters: SearchFilterData[] = []): QueryModel {
        return <QueryModel>{
            queryText: queryText,
            filters: filters
        }
    }

    public queryModelToRoute(queryModel: QueryModel): any {
        let route = {
            query: queryModel.queryText || ''
        };

        for (let filter of queryModel.filters.map(data => {
            return {
                param: this.getParamForFieldName(data.fieldName),
                value: searchFilterDataToParam(data)
            };
        })) {
            route[filter.param] = filter.value;
        }

        return route;
    }

    public async search(queryModel: QueryModel, corpus: Corpus): Promise<SearchResults> {
        this.logService.info(`Requested flat results for query: ${queryModel.queryText}, with filters: ${JSON.stringify(queryModel.filters)}`);
        let user = this.userService.getCurrentUserOrFail();
        let query = new Query(queryModel, corpus.name, user.id);
        let querySave = this.queryService.save(query, true);
        let results = this.limitResults(await this.elasticSearchService.search(corpus, queryModel));
        querySave.then((savedQuery) => {
            // update the last saved query object, it might have changed on the server
            if (!results.completed) {
                savedQuery.aborted = true;
            }
            savedQuery.transferred = results.total;
            this.queryService.save(savedQuery, undefined, results.completed);
        });

        return <SearchResults>{
            completed: results.completed,
            fields: corpus.fields.filter(field => field.prominentField),
            total: results.total,
            documents: results.documents,
            queryModel: queryModel,
            retrieved: results.retrieved,
            scrollId: results.scrollId
        };
    }

    public searchObservable(corpus: Corpus, queryModel: QueryModel): Observable<SearchResults> {
        let completed = false;
        let totalTransferred = 0;

        // Log the query to the database
        this.logService.info(`Requested observable results for query: ${JSON.stringify(queryModel)}`);

        // Perform the search and obtain output stream
        return this.elasticSearchService.searchObservable(
            corpus, queryModel, this.userService.getCurrentUserOrFail().downloadLimit);
    }

    public async searchForVisualization<TKey>(corpus: Corpus, queryModel: QueryModel, aggregator: string): Promise<AggregateResults<TKey>> {
        return this.elasticSearchService.aggregateSearch<TKey>(corpus, queryModel, aggregator);
    }

    /**
     * Search and return a simple two-dimensional string array containing the values.
     */
    public async searchAsTable(corpus: Corpus, queryModel: QueryModel, fields: CorpusField[] = []): Promise<string[][]> {
        let totalTransferred = 0;

        this.logService.info(`Requested tabular data for query: ${JSON.stringify(queryModel)}`);

        return new Promise<string[][]>((resolve, reject) => {
            let rows: string[][] = [];
            this.searchObservable(corpus, queryModel)
                .subscribe(
                    result => {
                        rows.push(...
                            result.documents.map(document =>
                                this.documentRow(document, fields.map(field => field.name))
                            )
                        );

                        totalTransferred = result.retrieved;
                    },
                    (error) => reject(error),
                    () => resolve(rows));
        });
    }

    /**
     * Iterate through some dictionaries and yield for each dictionary the values
     * of the selected fields, in given order.
     */
    private documentRow<T>(document: { [id: string]: T }, fieldNames: string[] = []): string[] {
        return fieldNames.map(
            field => this.documentFieldValue(document.fieldValues[field])
        );
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

    private limitResults(results: SearchResults) {
        let downloadLimit = this.userService.getCurrentUserOrFail().downloadLimit;
        if (downloadLimit && !results.completed && results.retrieved >= downloadLimit) {
            // download limit exceeded
            results.completed = true;
        }
        return results;
    }

    public getParamForFieldName(fieldName: string) {
        return `$${fieldName}`;
    }
}
