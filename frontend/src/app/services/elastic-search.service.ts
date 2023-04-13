/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { FoundDocument, Corpus, CorpusField, QueryModel, SearchResults,
    AggregateQueryFeedback, SearchFilter, SearchFilterData, searchFilterDataFromField,
    EsFilter, EsDateFilter, EsRangeFilter, EsTermsFilter, EsBooleanFilter,
    EsSearchClause, BooleanQuery, MatchAll } from '../models/index';


import * as _ from 'lodash';
import { findByName } from '../utils/utils';
import { makeBooleanQuery, makeEsSearchClause, makeHighlightSpecification, makeSortSpecification, } from '../utils/es-query';


@Injectable()
export class ElasticSearchService {
    private client: Client;
    private resultsPerPage = 20;

    constructor(private http: HttpClient) {
        this.client = new Client(this.http);
    }

    public makeEsQuery(queryModel: QueryModel, fields?: CorpusField[]): EsQuery | EsQuerySorted {
        const clause: EsSearchClause = makeEsSearchClause(queryModel.queryText, fields);

        let query: EsQuery | EsQuerySorted;
        if (queryModel.filters) {
            query = {
                query: makeBooleanQuery(clause, this.mapFilters(queryModel.filters))
            };
        } else {
            query = {
                query: clause
            };
        }

        const sort = makeSortSpecification(queryModel.sortBy, queryModel.sortAscending);
        _.merge(query, sort);

        const highlight = makeHighlightSpecification(fields, queryModel.queryText, queryModel.highlight);
        _.merge(query, highlight);

        return query;
    }

    public esQueryToQueryModel(query: EsQuery, corpus: Corpus): QueryModel {
        const queryText = this.queryTextFromEsSearchClause(query.query);
        const filters = this.filtersFromEsQuery(query, corpus);

        if (filters.length) {
            return { queryText, filters };
        } else {
            return { queryText };
        }
    }

    getDocumentById(id: string, corpus: Corpus): Promise<FoundDocument> {
        const query = {
            body: {
                query: {
                    term: {
                        _id: id,
                    }
                }
            },
            size: 1,
            index: corpus.index,
        };
        return this.client.search(query).then(this.firstDocumentFromResponse.bind(this));
    }

    private firstDocumentFromResponse(response: SearchResponse): FoundDocument {
        const parsed = this.parseResponse(response);
        if (parsed.documents.length) {
            return _.first(parsed.documents);
        }
    }

    private queryTextFromEsSearchClause(query: EsSearchClause | BooleanQuery | EsFilter): string {
        const clause = 'bool' in query ? query.bool.must : query;

        if ('simple_query_string' in clause) {
            return clause.simple_query_string.query;
        }
    }

    private filtersFromEsQuery(query: EsQuery, corpus: Corpus): SearchFilter<SearchFilterData>[] {
        if ('bool' in query.query) {
            const filters = query.query.bool.filter;
            return filters.map(filter => this.esFilterToSearchFilter(filter, corpus));
        }
        return [];
    }

    private esFilterToSearchFilter(filter: EsFilter, corpus: Corpus): SearchFilter<SearchFilterData> {
        let fieldName: string;
        let value: any;

        if ('term' in filter) { // boolean filter
            fieldName = _.keys(filter.term)[0];
            value = filter.term[fieldName];
        } else if ('terms' in filter) { // multiple choice filter
            fieldName = _.keys(filter.terms)[0];
            value = filter.terms[fieldName];
        } else { // range or date filter
            fieldName = _.keys(filter.range)[0];
            value = [filter.range[fieldName].gte.toString(), filter.range[fieldName].lte.toString()];
        }
        const field: CorpusField = findByName(corpus.fields, fieldName);
        const filterData = searchFilterDataFromField(field, value);
        return {
            fieldName: field.name,
            description: field.searchFilter.description,
            useAsFilter: true,
            currentData: filterData,
            defaultData: field.searchFilter.defaultData,
        };
    }

    /**
     * Construct the aggregator, based on kind of field
     * Date fields are aggregated in year intervals
     */
    makeAggregation(aggregator: string, size?: number, min_doc_count?: number) {
        const aggregation = {
            terms: {
                field: aggregator,
                size,
                min_doc_count
            }
        };
        return aggregation;
    }

    private executeAggregate(index: Corpus, aggregationModel) {
        return this.client.search({
            index: index.name,
            size: 0,
            body: aggregationModel
        });
    }

    /**
     * Execute an ElasticSearch query and return a dictionary containing the results.
     */
    private async execute<T>(index: Corpus, esQuery: EsQuery, size: number, from?: number) {
        return this.client.search<T>({
            index: index.name,
            from,
            size,
            body: esQuery
        });
    }

    public async aggregateSearch<TKey>(
        corpusDefinition: Corpus,
        queryModel: QueryModel,
        aggregators: Aggregator[]): Promise<AggregateQueryFeedback> {
        const aggregations = {};
        aggregators.forEach(d => {
            aggregations[d.name] = this.makeAggregation(d.name, d.size, 1);
        });
        const esQuery = this.makeEsQuery(queryModel);
        const aggregationModel = Object.assign({ aggs: aggregations }, esQuery);
        const result = await this.executeAggregate(corpusDefinition, aggregationModel);
        const aggregateData = {};
        Object.keys(result.aggregations).forEach(fieldName => {
            aggregateData[fieldName] = result.aggregations[fieldName].buckets;
        });
        return {
            completed: true,
            aggregations: aggregateData
        };
    }

    public async dateHistogramSearch<TKey>(
        corpusDefinition: Corpus,
        queryModel: QueryModel,
        fieldName: string,
        timeInterval: string): Promise<AggregateQueryFeedback> {
        const agg = {
            [fieldName]: {
                date_histogram: {
                    field: fieldName,
                    calendar_interval: timeInterval
                }
            }
        };
        const esQuery = this.makeEsQuery(queryModel);
        const aggregationModel = Object.assign({ aggs: agg }, esQuery);
        const result = await this.executeAggregate(corpusDefinition, aggregationModel);
        const aggregateData = {};
        Object.keys(result.aggregations).forEach(field => {
            aggregateData[field] = result.aggregations[field].buckets;
        });
        return {
            completed: true,
            aggregations: aggregateData
        };
    }



    public async search(
        corpusDefinition: Corpus,
        queryModel: QueryModel,
        size?: number,
    ): Promise<SearchResults> {
        const esQuery = this.makeEsQuery(queryModel, corpusDefinition.fields);
        // Perform the search
        const response = await this.execute(corpusDefinition, esQuery, size || this.resultsPerPage);
        return this.parseResponse(response);
    }


    /**
     * Load results for requested page
     */
    public async loadResults(
        corpusDefinition: Corpus,
        queryModel: QueryModel, from: number,
        size: number): Promise<SearchResults> {
        const esQuery = this.makeEsQuery(queryModel, corpusDefinition.fields);
        // Perform the search
        const response = await this.execute(corpusDefinition, esQuery, size || this.resultsPerPage, from);
        return this.parseResponse(response);
    }

    /**
     * Extract relevant information from dictionary returned by ES
     *
     * @param response
     * @param queryModel
     * @param alreadyRetrieved
     * @param completed
     */
    private parseResponse(response: SearchResponse): SearchResults {
        const hits = response.hits.hits;
        return {
            documents: hits.map(hit => this.hitToDocument(hit, response.hits.max_score)),
            total: response.hits.total
        };
    }

    /**
     * return the id, relevance and field values of a given document
     */
    private hitToDocument(hit: SearchHit, maxScore: number): FoundDocument {
        return {
            id: hit._id,
            relevance: hit._score / maxScore,
            fieldValues: Object.assign({ id: hit._id }, hit._source),
            highlight: hit.highlight,
        } as FoundDocument;
    }

    /**
     * Convert filters from query model into elasticsearch form
     */
    private mapFilters(filters: SearchFilter<SearchFilterData>[]): EsFilter[] {
        return filters.map(filter => {
            switch (filter.currentData.filterType) {
                case 'BooleanFilter':
                    return { term: { [filter.fieldName]: filter.currentData.checked } };
                case 'MultipleChoiceFilter':
                    return {
                        terms: {
                            [filter.fieldName]: _.map(filter.currentData.selected, f => decodeURIComponent(f))
                        }
                    };
                case 'RangeFilter':
                    return {
                        range: {
                            [filter.fieldName]: { gte: filter.currentData.min, lte: filter.currentData.max }
                        }
                    };
                case 'DateFilter':
                    return {
                        range: {
                            [filter.fieldName]: { gte: filter.currentData.min, lte: filter.currentData.max, format: 'yyyy-MM-dd' }
                        }
                    };
            }
        });
    }
}

interface Connection {
    client: Client;
    config: {
        overviewQuerySize: number;
        scrollPagesize: number;
        scrollTimeout: string;
    };
}

export type EsQuerySorted = EsQuery & {
    sort: { [fieldName: string]: 'desc' | 'asc' }[];
};

export interface EsQuery {
    aborted?: boolean;
    completed?: Date;
    query: EsSearchClause | BooleanQuery | EsFilter;
    highlight?: {};
    transferred?: number;
}



interface Aggregator {
    name: string;
    size: number;
}

export class Client {
    constructor(private http: HttpClient) {
    }
    search<T>(searchParams: SearchParams): Promise<SearchResponse> {
        const url = `/api/es/${searchParams.index}/_search`;
        const optionDict = {
            size: searchParams.size.toString()
        };
        if (searchParams.from) {
            optionDict['from'] = searchParams.from.toString();
        }
        const options = {
            params: new HttpParams({ fromObject: optionDict })
        };
        return this.http.post<SearchResponse>(url, searchParams.body, options).toPromise();
    }
}

export interface SearchParams {
    index: string;
    size: number;
    from?: number;
    body: EsQuery;
}

export interface SearchResponse {
    took: number;
    timed_out: boolean;
    hits: {
        total: {
            value: number;
            relation: string;
        };
        max_score: number;
        hits: Array<SearchHit>;
    };
    aggregations?: any;
}

export interface SearchHit {
    _id: string;
    _score: number;
    _source: {};
    highlight: {};
}
