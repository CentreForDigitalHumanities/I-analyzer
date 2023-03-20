/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import {
    FoundDocument, Corpus, QueryModel, SearchResults,
    AggregateQueryFeedback, EsSearchClause, BooleanQuery,
    EsFilter
} from '../models/index';
import * as _ from 'lodash';


@Injectable()
export class ElasticSearchService {
    private client: Client;
    private resultsPerPage = 20;

    constructor(private http: HttpClient) {
        this.client = new Client(this.http);
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
        const esQuery = queryModel.toEsQuery();
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
        const esQuery = queryModel.toEsQuery();
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
        queryModel: QueryModel,
        size?: number,
    ): Promise<SearchResults> {
        const esQuery = queryModel.toEsQuery();

        // Perform the search
        const response = await this.execute(queryModel.corpus, esQuery, size || this.resultsPerPage);
        return this.parseResponse(response);
    }


    /**
     * Load results for requested page
     */
    public async loadResults(
        queryModel: QueryModel, from: number,
        size: number): Promise<SearchResults> {
        const esQuery = queryModel.toEsQuery();
        // Perform the search
        const response = await this.execute(queryModel.corpus, esQuery, size || this.resultsPerPage, from);
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
    private hitToDocument(hit: SearchHit, maxScore: number) {
        return {
            id: hit._id,
            relevance: hit._score / maxScore,
            fieldValues: Object.assign({ id: hit._id }, hit._source),
            highlight: hit.highlight,
        } as FoundDocument;
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
