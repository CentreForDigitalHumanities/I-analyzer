import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/finally';
import 'rxjs/add/operator/map';

import { ApiService } from './api.service';
import { ElasticSearchService } from './elastic-search.service';
import { LogService } from './log.service';
import { QueryService } from './query.service';
import { UserService } from './user.service';
import { Corpus, CorpusField, Query, QueryModel, SearchFilterData, searchFilterDataToParam, SearchResults, AggregateResult, AggregateQueryFeedback } from '../models/index';

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

    /**
     * Clear ES's scrollId and resources
     */
    public async clearESScroll(corpus: Corpus, existingResults: SearchResults): Promise<void> {
        return this.elasticSearchService.clearScroll(corpus, existingResults);
    }

    /**
     * Construct a dictionary representing an ES query.
     * @param queryString Read as the `simple_query_string` DSL of standard ElasticSearch.
     * @param fields Optional list of fields to restrict the queryString to.
     * @param filters A list of dictionaries representing the ES DSL.
     */
    public createQueryModel(queryText: string = '', fields: string[] | null = null, filters: SearchFilterData[] = [], sortField: CorpusField = null, sortAscending = false): QueryModel {
        let model: QueryModel = {
            queryText: queryText,
            filters: filters,
            sortBy: sortField ? sortField.name : undefined,
            sortAscending: sortAscending
        };
        if (fields) {
            model.fields = fields;
        }
        return model;
    }

    public queryModelToRoute(queryModel: QueryModel): any {
        let route = {
            query: queryModel.queryText || ''
        };

        if (queryModel.fields) {
            route['fields'] = queryModel.fields.join(',');
        }

        for (let filter of queryModel.filters.map(data => {
            return {
                param: this.getParamForFieldName(data.fieldName),
                value: searchFilterDataToParam(data)
            };
        })) {
            route[filter.param] = filter.value;
        }

        if (queryModel.sortBy) {
            route['sort'] = `${queryModel.sortBy},${queryModel.sortAscending ? 'asc' : 'desc'}`;
        } else {
            delete route['sort'];
        }
        return route;
    }

    public async search(queryModel: QueryModel, corpus: Corpus): Promise<SearchResults> {
        this.logService.info(`Requested flat results for query: ${queryModel.queryText}, with filters: ${JSON.stringify(queryModel.filters)}`);
        let user = await this.userService.getCurrentUser();
        let query = new Query(queryModel, corpus.name, user.id);
        let querySave = this.queryService.save(query, true);
        let results = await this.limitResults(await this.elasticSearchService.search(corpus, queryModel));
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
            fields: corpus.fields.filter(field => field.resultsOverview),
            total: results.total,
            documents: results.documents,
            queryModel: queryModel,
            retrieved: results.retrieved,
            scrollId: results.scrollId
        };
    }

    public async searchObservable(corpus: Corpus, queryModel: QueryModel): Promise<Observable<SearchResults>> {
        let completed = false;
        let totalTransferred = 0;

        // Log the query to the database
        this.logService.info(`Requested observable results for query: ${JSON.stringify(queryModel)}`);

        // Perform the search and obtain output stream
        return this.elasticSearchService.searchObservable(
            corpus, queryModel, (await this.userService.getCurrentUser()).downloadLimit);
    }


    public async aggregateSearch<TKey>(corpus: Corpus, queryModel: QueryModel, aggregators: any): Promise<AggregateQueryFeedback>{
        return this.elasticSearchService.aggregateSearch<TKey>(corpus, queryModel, aggregators);
    }

    public async getWordcloudData<TKey>(fieldName: string, textContent: string[]): Promise<any>{
        return this.apiService.getWordcloudData({'content_list': textContent}).then( result => {
            return new Promise( (resolve, reject) => {
                if (result['data']) {
                    resolve({[fieldName]: result['data']});
                }
                else {
                    reject({'message': 'No word cloud data could be extracted from your search results.'});
                }
            });
        });
    }

    public async getRelatedWords(queryTerm: string, corpusName: string): Promise<any> {
        return this.apiService.getRelatedWords({'query_term': queryTerm, 'corpus_name': corpusName}).then( result => {
            return new Promise( (resolve, reject) => {
                if (result['success'] === true) {
                    resolve({'graphData': {
                                'labels': result['related_word_data'].time_points, 
                                'datasets':result['related_word_data'].similar_words_subsets
                            },
                            'tableData': result['related_word_data'].similar_words_all
                    });
                }
                else {
                    reject({'message': result['message']})
                }
            })
        });
    }

    public async getRelatedWordsTimeInterval(queryTerm: string, corpusName: string, timeInterval: string): Promise<any> {
        return this.apiService.getRelatedWordsTimeInterval({'query_term': queryTerm, 'corpus_name': corpusName, 'time': timeInterval}).then( result => {
            return new Promise( (resolve, reject) => {
                if (result['success'] === true) {
                    resolve({'graphData': {
                                'labels': result['related_word_data'].time_points, 
                                'datasets':result['related_word_data'].similar_words_subsets
                            }
                    });
                }
                else {
                    reject({'message': result['message']})
                }
            })
        });
    }

    /**
     * Search and return a simple two-dimensional string array containing the values.
     */
    public async searchAsTable(corpus: Corpus, queryModel: QueryModel, fields: CorpusField[] = []): Promise<string[][]> {
        let totalTransferred = 0;

        this.logService.info(`Requested tabular data for query: ${JSON.stringify(queryModel)}`);

        return new Promise<string[][]>(async (resolve, reject) => {
            let rows: string[][] = [];
            (await this.searchObservable(corpus, queryModel))
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

    private async limitResults(results: SearchResults) {
        let downloadLimit = (await this.userService.getCurrentUser()).downloadLimit;
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
