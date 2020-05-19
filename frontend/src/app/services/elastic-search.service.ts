import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpParams } from '@angular/common/http';

import { FoundDocument, ElasticSearchIndex, QueryModel, SearchResults, AggregateResult, AggregateQueryFeedback, SearchFilter, SearchFilterData } from '../models/index';

import { ApiRetryService } from './api-retry.service';

import * as _ from 'lodash';


type Connections = { [serverName: string]: Connection };

@Injectable()
export class ElasticSearchService {
    private connections: Promise<Connections>;

    constructor(apiRetryService: ApiRetryService, private http: HttpClient) {
        this.connections = apiRetryService.requireLogin(api => api.esConfig()).then(configs =>
            configs.reduce((connections: Connections, config) => {
                const client = new Client(this.http, config.host);
                connections[config.name] = {
                    config,
                    client: client
                }
                return connections;
            }, {}));
    }

    public makeEsQuery(queryModel: QueryModel): EsQuery | EsQuerySorted {
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
            }
        } else {
            query = {
                'query': clause
            }
        }

        if (queryModel.sortBy) {
            (query as EsQuerySorted).sort = [{
                [queryModel.sortBy]: queryModel.sortAscending ? 'asc' : 'desc'
            }];
        }

        return query;
    }

    /**
    * Construct the aggregator, based on kind of field
    * Date fields are aggregated in year intervals
    */
    makeAggregation(aggregator: string, size?: number, min_doc_count?: number) {
        let aggregation = {
            terms: {
                field: aggregator,
                size: size,
                min_doc_count: min_doc_count
            }
        }
        return aggregation;
    }

    private executeAggregate(index: ElasticSearchIndex, aggregationModel) {
        return this.connections.then((connections) => connections[index.serverName].client.search({
            index: index.index,
            size: 0,
            body: aggregationModel
        }));
    }

    /**
     * Execute an ElasticSearch query and return a dictionary containing the results.
     */
    private async execute<T>(index: ElasticSearchIndex, esQuery: EsQuery, size: number, from?: number) {
        let connection = (await this.connections)[index.serverName];
        return connection.client.search<T>({
            index: index.index,
            from: from,
            size: size,
            body: esQuery
        });
    }

    public async aggregateSearch<TKey>(corpusDefinition: ElasticSearchIndex, queryModel: QueryModel, aggregators: Aggregator[]): Promise<AggregateQueryFeedback> {
        let aggregations = {}
        aggregators.forEach(d => {
            aggregations[d.name] = this.makeAggregation(d.name, d.size, 1);
        });
        let esQuery = this.makeEsQuery(queryModel);
        let aggregationModel = Object.assign({ aggs: aggregations }, esQuery);
        let result = await this.executeAggregate(corpusDefinition, aggregationModel);
        let aggregateData = {}
        Object.keys(result.aggregations).forEach(fieldName => {
            aggregateData[fieldName] = result.aggregations[fieldName].buckets
        })
        return {
            completed: true,
            aggregations: aggregateData
        }
    }

    public async dateHistogramSearch<TKey>(corpusDefinition: ElasticSearchIndex, queryModel: QueryModel, fieldName: string, timeInterval: string): Promise<AggregateQueryFeedback> {
        let agg = {
            [fieldName]: {
                date_histogram: {
                    field: fieldName,
                    interval: timeInterval
                }
            }
        }
        let esQuery = this.makeEsQuery(queryModel);
        let aggregationModel = Object.assign({ aggs: agg }, esQuery);
        let result = await this.executeAggregate(corpusDefinition, aggregationModel);
        let aggregateData = {}
        Object.keys(result.aggregations).forEach(fieldName => {
            aggregateData[fieldName] = result.aggregations[fieldName].buckets
        })
        return {
            completed: true,
            aggregations: aggregateData
        }
    }



    public async search(corpusDefinition: ElasticSearchIndex, queryModel: QueryModel, size?: number): Promise<SearchResults> {
        let connection = (await this.connections)[corpusDefinition.serverName];
        let esQuery = this.makeEsQuery(queryModel);
        // Perform the search
        let response = await this.execute(corpusDefinition, esQuery, size || connection.config.overviewQuerySize);
        return this.parseResponse(response);
    }


    /**
     * Load results for requested page
     */
    public async loadResults(corpusDefinition: ElasticSearchIndex, queryModel: QueryModel, from: number, size: number): Promise<SearchResults> {
        let connection = (await this.connections)[corpusDefinition.serverName];
        let esQuery = this.makeEsQuery(queryModel);
        // Perform the search
        let response = await this.execute(corpusDefinition, esQuery, size || connection.config.overviewQuerySize, from);
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
        let hits = response.hits.hits;
        return {
            documents: hits.map(hit => this.hitToDocument(hit, response.hits.max_score)),
            total: response.hits.total
        }
    }

    /**
     * return the id, relevance and field values of a given document
     */
    private hitToDocument(hit: SearchHit, maxScore: number) {
        return <FoundDocument>{
            id: hit._id,
            relevance: hit._score / maxScore,
            fieldValues: Object.assign({ id: hit._id }, hit._source)
        };
    }

    /**
    * Convert filters from query model into elasticsearch form
    */
    private mapFilters(filters: SearchFilter<SearchFilterData>[]) {
        return filters.map(filter => {
            switch (filter.currentData.filterType) {
                case "BooleanFilter":
                    return { 'term': { [filter.fieldName]: filter.currentData.checked } };
                case "MultipleChoiceFilter":
                    return {
                        'terms': {
                            [filter.fieldName]: _.map(filter.currentData.selected, f => {
                                return decodeURIComponent(f);
                            })
                        }
                    };
                case "RangeFilter":
                    return {
                        'range': {
                            [filter.fieldName]: { gte: filter.currentData.min, lte: filter.currentData.max }
                        }
                    }
                case "DateFilter":
                    return {
                        'range': {
                            [filter.fieldName]: { gte: filter.currentData.min, lte: filter.currentData.max, format: 'yyyy-MM-dd' }
                        }
                    }
            }
        });
    };
}

type Connection = {
    client: Client,
    config: {
        overviewQuerySize: number,
        scrollPagesize: number,
        scrollTimeout: string
    }
};
export type EsQuerySorted = EsQuery & {
    sort: { [fieldName: string]: 'desc' | 'asc' }[]
};
export type EsQuery = {
    aborted?: boolean,
    completed?: Date,
    query: EsSearchClause | {
        'bool': {
            must: EsSearchClause,
            filter: any[],
        }
    },
    transferred?: Number
};

type EsSearchClause = {
    simple_query_string: {
        query: string,
        fields?: string[],
        lenient: true,
        default_operator: 'or'
    }
} | {
    match_all: {}
};

type Aggregator = {
    name: string,
    size: number
};

type EsAggregateResult = {
    [fieldName: string]: {
        doc_count_error_upper_bound: number,
        sum_other_doc_count: number,
        buckets: AggregateResult[]
    }
}

export class Client {
    constructor(private http: HttpClient, private host: string){
    };
    search<T>(searchParams: SearchParams): Promise<SearchResponse> {
        const url = `${this.host}/${searchParams.index}/_search`;
        let options = { params: new HttpParams().set('size', searchParams.size.toString())}
        if (searchParams.from) {
            options.params.set('from', searchParams.from.toString());
        }
        return this.http.post<SearchResponse>(url, searchParams.body, options).toPromise()
    }
}

export interface SearchParams {
    index: string,
    size: Number,
    from?: Number,
    body: EsQuery
}

export interface SearchResponse {
    took: number;
    timed_out: boolean;
    hits: {
        total: number;
        max_score: number;
        hits: Array<SearchHit>;
    };
    aggregations?: any;
}

export interface SearchHit {
    _id: string, 
    _score: number, 
    _source: {}
}