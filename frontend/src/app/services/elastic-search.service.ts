import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { FoundDocument, Corpus, CorpusField, QueryModel, SearchResults,
    AggregateQueryFeedback, SearchFilter, SearchFilterData } from '../models/index';


import * as _ from 'lodash';


@Injectable()
export class ElasticSearchService {
    private client: Client;
    private resultsPerPage = 20;

    constructor(private http: HttpClient) {
        this.client = new Client(this.http);
    }

    public makeEsQuery(queryModel: QueryModel, fields?: CorpusField[]): EsQuery | EsQuerySorted {
        let clause: EsSearchClause;
        if (queryModel.queryText) {
            clause = {
                simple_query_string: {
                    query: queryModel.queryText,
                    lenient: true,
                    default_operator: 'or'
                }
            };
            if (queryModel.fields) {
                clause.simple_query_string.fields = queryModel.fields;
            }
        } else {
            clause = {
                match_all: {}
            };
        }

        let query: EsQuery | EsQuerySorted;
        if (queryModel.filters) {
            query = {
                'query': {
                    'bool': {
                        must: clause,
                        filter: this.mapFilters(queryModel.filters),
                    }
                }
            };
        } else {
            query = {
                'query': clause
            };
        }

        if (queryModel.sortBy) {
            (query as EsQuerySorted).sort = [{
                [queryModel.sortBy]: queryModel.sortAscending ? 'asc' : 'desc'
            }];
        }

        if (fields && queryModel.queryText && queryModel.highlight) {
            const highlightFields = fields.filter(field => field.searchable);
            query.highlight = {
                fragment_size: queryModel.highlight,
                pre_tags: ['<span class="highlight">'],
                post_tags: ['</span>'],
                order: 'score',
                fields: highlightFields.map( field => {
                    return { [field.name]: { }
                };
            })
            };
        }

        return query;
    }

    /**
    * Construct the aggregator, based on kind of field
    * Date fields are aggregated in year intervals
    */
    makeAggregation(aggregator: string, size?: number, min_doc_count?: number) {
        const aggregation = {
            terms: {
                field: aggregator,
                size: size,
                min_doc_count: min_doc_count
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
            from: from,
            size: size,
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
                    interval: timeInterval
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
    private hitToDocument(hit: SearchHit, maxScore: number) {
        return <FoundDocument>{
            id: hit._id,
            relevance: hit._score / maxScore,
            fieldValues: Object.assign({ id: hit._id }, hit._source),
            highlight: hit.highlight,
        };
    }

    /**
    * Convert filters from query model into elasticsearch form
    */
    private mapFilters(filters: SearchFilter<SearchFilterData>[]): EsFilter[] {
        return filters.map(filter => {
            switch (filter.currentData.filterType) {
                case 'BooleanFilter':
                    return { 'term': { [filter.fieldName]: filter.currentData.checked } };
                case 'MultipleChoiceFilter':
                    return {
                        'terms': {
                            [filter.fieldName]: _.map(filter.currentData.selected, f => {
                                return decodeURIComponent(f);
                            })
                        }
                    };
                case 'RangeFilter':
                    return {
                        'range': {
                            [filter.fieldName]: { gte: filter.currentData.min, lte: filter.currentData.max }
                        }
                    };
                case 'DateFilter':
                    return {
                        'range': {
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
        overviewQuerySize: number,
        scrollPagesize: number,
        scrollTimeout: string
    };
}

export type EsQuerySorted = EsQuery & {
    sort: { [fieldName: string]: 'desc' | 'asc' }[]
};

export interface EsQuery {
    aborted?: boolean;
    completed?: Date;
    query: EsSearchClause | BooleanQuery;
    highlight?: {};
    transferred?: Number;
}

interface BooleanQuery {
    'bool': {
        must: EsSearchClause,
        filter: EsFilter[],
    };
}

interface MatchAll {
    match_all: {};
}

interface SimpleQueryString {
    simple_query_string: {
        query: string,
        fields?: string[],
        lenient: true,
        default_operator: 'or'
    };
}

type EsSearchClause = MatchAll | SimpleQueryString;

interface EsDateFilter {
    range: {
        [field: string]: {
            gte: string,
            lte: string,
            format: 'yyyy-MM-dd'
        }
    };
}

interface EsTermsFilter {
    terms: {
        [field: string]: string[]
    };
}

interface EsBooleanFilter {
    term: {
        [field: string]: boolean
    };
}

interface EsRangeFilter {
    range: {
        [field: string]: {
            gte: number,
            lte: number
        }
    };
}

type EsFilter = EsDateFilter | EsTermsFilter | EsBooleanFilter | EsRangeFilter;

interface Aggregator {
    name: string;
    size: number;
}

export class Client {
    constructor(private http: HttpClient) {
    }
    search<T>(searchParams: SearchParams): Promise<SearchResponse> {
        const url = `es/${searchParams.index}/_search`;
        const optionDict = {
            'size': searchParams.size.toString()
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
    size: Number;
    from?: Number;
    body: EsQuery;
}

export interface SearchResponse {
    took: number;
    timed_out: boolean;
    hits: {
        total: {
            value: number,
            relation: string
        }
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
