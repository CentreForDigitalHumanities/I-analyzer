import { Injectable } from '@angular/core';



import { ApiService } from './api.service';
import { ElasticSearchService } from './elastic-search.service';
import { LogService } from './log.service';
import { QueryService } from './query.service';
import { UserService } from './user.service';
import { Corpus, CorpusField, Query, QueryModel, SearchFilter, searchFilterDataToParam, SearchResults,
    AggregateResult, AggregateQueryFeedback, SearchFilterData, NgramParameters, WordSimilarity, RelatedWordsResults, WordInModelResult } from '../models/index';
import { WordmodelsService } from './wordmodels.service';

const highlightFragmentSize = 50;

@Injectable()
export class SearchService {
    constructor(
        private apiService: ApiService,
        private elasticSearchService: ElasticSearchService,
        private queryService: QueryService,
        private userService: UserService,
        private logService: LogService,
        private wordModelsService: WordmodelsService) {
        window['apiService'] = this.apiService;
    }

    /**
     * Load results for requested page
     */
    public async loadResults(corpus: Corpus, queryModel: QueryModel, from: number, size: number): Promise<SearchResults> {
        this.logService.info(`Requested additional results for: ${JSON.stringify(queryModel)}`);
        const results = await this.elasticSearchService.loadResults(corpus, queryModel, from, size);
        results.fields = corpus.fields.filter(field => field.resultsOverview);
        return results;
    }

    /**
     * Construct a dictionary representing an ES query.
     * @param queryString Read as the `simple_query_string` DSL of standard ElasticSearch.
     * @param fields Optional list of fields to restrict the queryString to.
     * @param filters A list of dictionaries representing the ES DSL.
     */
    public createQueryModel(
        queryText: string = '', fields: string[] | null = null, filters: SearchFilter<SearchFilterData>[] = [],
        sortField: CorpusField = null, sortAscending = false, highlight: number = null
    ): QueryModel {
        const model: QueryModel = {
            queryText: queryText,
            filters: filters,
            sortBy: sortField ? sortField.name : undefined,
            sortAscending: sortAscending
        };
        if (fields) {
            model.fields = fields;
        }
        if (highlight) {
            model.highlight = highlight;
        }
        return model;
    }

    public queryModelToRoute(queryModel: QueryModel, usingDefaultSortField = false, nullableParams = []): any {
        const route = {
            query: queryModel.queryText || ''
        };

        if (queryModel.fields) {
            route['fields'] = queryModel.fields.join(',');
        } else { route['fields'] = null; }

        for (const filter of queryModel.filters.map(data => {
            return {
                param: this.getParamForFieldName(data.fieldName),
                value: searchFilterDataToParam(data)
            };
        })) {
            route[filter.param] = filter.value;
        }

        if (!usingDefaultSortField && queryModel.sortBy) {
            route['sort'] = `${queryModel.sortBy},${queryModel.sortAscending ? 'asc' : 'desc'}`;
        } else {
            route['sort'] = null;
        }
        if (queryModel.highlight) {
            route['highlight'] = `${queryModel.highlight}`;
        } else { route['highlight'] = null; }
        if (nullableParams.length) {
            nullableParams.forEach( param => route[param] = null);
        }
        return route;
    }

    public async search(queryModel: QueryModel, corpus: Corpus): Promise<SearchResults> {
        this.logService.info(`Requested flat results for query: ${queryModel.queryText}, with filters: ${JSON.stringify(queryModel.filters)}`);
        const user = await this.userService.getCurrentUser();
        const query = new Query(queryModel, corpus.name, user.id);
        const results = await this.elasticSearchService.search(corpus, queryModel, highlightFragmentSize);
        query.totalResults = results.total;
        await this.queryService.save(query, true);

        return <SearchResults>{
            fields: corpus.fields.filter(field => field.resultsOverview),
            total: results.total,
            documents: results.documents,
        };
    }

    public async aggregateSearch<TKey>(corpus: Corpus, queryModel: QueryModel, aggregators: any): Promise<AggregateQueryFeedback> {
        return this.elasticSearchService.aggregateSearch<TKey>(corpus, queryModel, aggregators);
    }

    public async aggregateTermFrequencySearch(
        corpus: Corpus, queryModel: QueryModel, fieldName: string, fieldValue: string|number, size: number
    ): Promise<{ success: boolean, message?: string, data?: AggregateResult }> {
        const esQuery = this.elasticSearchService.makeEsQuery(queryModel);
        return this.apiService.getAggregateTermFrequency({
            corpus_name: corpus.name,
            es_query: esQuery,
            field_name: fieldName,
            field_value: fieldValue,
            size: size,
        });
    }

    public async dateHistogramSearch<TKey>(
        corpus: Corpus, queryModel: QueryModel, fieldName: string, timeInterval: string
    ): Promise<AggregateQueryFeedback> {
        return this.elasticSearchService.dateHistogramSearch<TKey>(corpus, queryModel, fieldName, timeInterval);
    }

    public async dateTermFrequencySearch<TKey>(
        corpus: Corpus, queryModel: QueryModel, fieldName: string, size: number, start_date: Date, end_date?: Date
    ): Promise<{ success: boolean, message?: string, data?: AggregateResult }> {
        const esQuery = this.elasticSearchService.makeEsQuery(queryModel);
        return this.apiService.getDateTermFrequency({
            corpus_name: corpus.name,
            es_query: esQuery,
            field_name: fieldName,
            start_date: start_date.toISOString().slice(0, 10),
            end_date: end_date ? end_date.toISOString().slice(0, 10) : null,
            size: size,
        });
    }

    public async getWordcloudData<TKey>(fieldName: string, queryModel: QueryModel, corpus: string, size: number): Promise<any> {
        const esQuery = this.elasticSearchService.makeEsQuery(queryModel);
        return this.apiService.wordcloud({'es_query': esQuery, 'corpus': corpus, 'field': fieldName, 'size': size}).then( result => {
            return new Promise( (resolve, reject) => {
                if (result['data']) {
                    resolve({[fieldName]: result['data']});
                } else {
                    reject({error: result['message']});
                }
            });
        });
    }

    public async getWordcloudTasks<TKey>(fieldName: string, queryModel: QueryModel, corpus: string): Promise<any> {
        const esQuery = this.elasticSearchService.makeEsQuery(queryModel);
        return this.apiService.wordcloudTasks({'es_query': esQuery, 'corpus': corpus, 'field': fieldName}).then( result => {
            return new Promise( (resolve, reject) => {
                if (result['success'] === true) {
                    resolve({taskIds: result['task_ids']});
                } else {
                    reject({error: result['message']});
                }
            });
        });
    }

    public async getRelatedWords(queryTerm: string, corpusName: string): Promise<RelatedWordsResults> {
        return this.wordModelsService.getRelatedWords({'query_term': queryTerm, 'corpus_name': corpusName}).then( result => {
            return new Promise( (resolve, reject) => {
                if (result['success'] === true) {
                    resolve(result.data);
                } else {
                    reject({'message': result.message});
                }
            });
        });
    }

    public async getWordSimilarity(term1: string, term2: string, corpusName: string): Promise<WordSimilarity[]> {
        return this.wordModelsService.getWordSimilarity({'term_1': term1, 'term_2': term2, 'corpus_name': corpusName})
            .then( result => {
            return new Promise( (resolve, reject) => {
                if (result['success'] === true) {
                    resolve(result.data);
                } else {
                    reject({'message': result.message});
                }
            });
        });
    }

    public async getRelatedWordsTimeInterval(
        queryTerm: string, corpusName: string, timeInterval: string
    ): Promise<WordSimilarity[]> {
        return this.wordModelsService.getRelatedWordsTimeInterval(
            {'query_term': queryTerm, 'corpus_name': corpusName, 'time': timeInterval}
        ).then( result => {
            return new Promise( (resolve, reject) => {
                if (result['success'] === true) {
                    resolve(result['data']);
                } else {
                    reject({'message': result.message});
                }
            });
        });
    }

    wordInModel(term: string, corpusName: string): Promise<WordInModelResult> {
        return this.wordModelsService.getWordInModel({
            query_term: term,
            corpus_name: corpusName,
        }).then(result => {
            return new Promise( (resolve, reject) => {
                if (result['success'] === true) {
                    resolve(result.result);
                } else {
                    reject({'message': result['message']});
                }
            });
        });
    }

    getNgramTasks(queryModel: QueryModel, corpusName: string, field: string, params: NgramParameters): Promise<any> {
        const esQuery = this.elasticSearchService.makeEsQuery(queryModel);
        return this.apiService.ngramTasks({
            es_query: esQuery,
            corpus_name: corpusName,
            field: field,
            ngram_size: params.size,
            term_position: params.positions,
            freq_compensation: params.freqCompensation,
            subfield: params.analysis,
            max_size_per_interval: params.maxDocuments,
            number_of_ngrams: params.numberOfNgrams,
            date_field: params.dateField,
        });
    }

    public getParamForFieldName(fieldName: string) {
        return `${fieldName}`;
    }
}
