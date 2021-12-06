import { Injectable } from '@angular/core';



import { ApiService } from './api.service';
import { ElasticSearchService } from './elastic-search.service';
import { LogService } from './log.service';
import { QueryService } from './query.service';
import { UserService } from './user.service';
import { Corpus, CorpusField, Query, QueryModel, SearchFilter, searchFilterDataToParam, SearchResults,
    AggregateResult, AggregateQueryFeedback, SearchFilterData } from '../models/index';
import { stringify } from 'querystring';

@Injectable()
export class SearchService {
    
    constructor(
        private apiService: ApiService,
        private elasticSearchService: ElasticSearchService,
        private queryService: QueryService,
        private userService: UserService,
        private logService: LogService) {
        window['apiService'] = this.apiService;
    }

    /**
     * Load results for requested page
     */
    public async loadResults(corpus: Corpus, queryModel: QueryModel, from: number, size: number): Promise<SearchResults> {
        this.logService.info(`Requested additional results for: ${JSON.stringify(queryModel)}`);
        let results = await this.elasticSearchService.loadResults(corpus, queryModel, from, size);
        results.fields = corpus.fields.filter(field => field.resultsOverview);
        return results;
    }

    /**
     * Construct a dictionary representing an ES query.
     * @param queryString Read as the `simple_query_string` DSL of standard ElasticSearch.
     * @param fields Optional list of fields to restrict the queryString to.
     * @param filters A list of dictionaries representing the ES DSL.
     */
    public createQueryModel(queryText: string = '', fields: string[] | null = null, filters: SearchFilter<SearchFilterData>[] = [], sortField: CorpusField = null, sortAscending = false): QueryModel {
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
        let results = await this.elasticSearchService.search(corpus, queryModel);
        query.totalResults = results.total;
        await this.queryService.save(query, true);

        return <SearchResults>{
            fields: corpus.fields.filter(field => field.resultsOverview),
            total: results.total,
            documents: results.documents
        };
    }

    public async aggregateSearch<TKey>(corpus: Corpus, queryModel: QueryModel, aggregators: any): Promise<AggregateQueryFeedback> {
        return this.elasticSearchService.aggregateSearch<TKey>(corpus, queryModel, aggregators);
    }

    public async dateHistogramSearch<TKey>(corpus: Corpus, queryModel: QueryModel, fieldName: string, timeInterval: string): Promise<AggregateQueryFeedback> {
        return this.elasticSearchService.dateHistogramSearch<TKey>(corpus, queryModel, fieldName, timeInterval);
    }

    public async getWordcloudData<TKey>(fieldName: string, queryModel: QueryModel, corpus: string, size: number): Promise<any>{
        let esQuery = this.elasticSearchService.makeEsQuery(queryModel);
        return this.apiService.wordcloud({'es_query': esQuery, 'corpus': corpus, 'field': fieldName, 'size': size}).then( result => {
            return new Promise( (resolve, reject) => {
                if (result['data']) {
                    resolve({[fieldName]: result['data']});
                }              
                else {
                    reject({error: result['message']});
                }
            });
        });
    }

    public async getWordcloudTasks<TKey>(fieldName: string, queryModel: QueryModel, corpus: string): Promise<any>{
        let esQuery = this.elasticSearchService.makeEsQuery(queryModel);
        return this.apiService.wordcloudTasks({'es_query': esQuery, 'corpus': corpus, 'field': fieldName}).then( result => {
            return new Promise( (resolve, reject) => {
                if (result['success']===true) {
                    resolve({taskIds: result['task_ids']});
                }
                else {
                    reject({error: result['message']});
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

    getNgram(queryModel: QueryModel, corpusName: string, field: string, ngramSize?: number, termPosition?: number[],
        freqCompensation?: boolean, subField?: string, maxSize?: number): Promise<any> {
        const esQuery = this.elasticSearchService.makeEsQuery(queryModel);
        return new Promise ( (resolve, reject) => {
            this.apiService.getNgrams({
                'es_query': esQuery,
                'corpus_name': corpusName,
                field: field,
                ngram_size: ngramSize,
                term_position: termPosition,
                freq_compensation: freqCompensation,
                subfield: subField,
                max_size_per_interval: maxSize
            }).then( result => {
                resolve({
                    'graphData': {
                        'labels': result.word_data.time_points,
                        'datasets': result.word_data.words,
                    }
                });
            }).catch( result => {
                reject({'message': result.message});
            });
        });
    }

    public getParamForFieldName(fieldName: string) {
        return `$${fieldName}`;
    }
}
