/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
    FoundDocument, Corpus, QueryModel, SearchResults,
    AggregateQueryFeedback, SearchHit, EsQuery, Aggregator
} from '../models/index';
import * as _ from 'lodash';
import { TagService } from './tag.service';
import { QueryParameters } from '../models/search-requests';
import { RESULTS_PER_PAGE } from '../models/page-results';


@Injectable()
export class ElasticSearchService {

    constructor(private http: HttpClient, private tagService: TagService) {
    }

    getDocumentById(id: string, corpus: Corpus): Promise<FoundDocument> {
        const esQuery = {
            query: {
                term: {
                    _id: id,
                }
            }
        };
        return this.execute(corpus, esQuery, 1,)
            .then(this.parseResponse.bind(this, corpus))
            .then(this.firstDocumentFromResults.bind(this));
    }

    public async aggregateSearch(
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

    public async dateHistogramSearch(
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

    /**
     * Load results for requested page
     */
    public async loadResults(
        queryModel: QueryModel,
        from: number,
        size: number = RESULTS_PER_PAGE
    ): Promise<SearchResults> {
        const esQuery = queryModel.toEsQuery();
        // Perform the search
        const response = await this.execute(queryModel.corpus, esQuery, size, from);
        return this.parseResponse(queryModel.corpus, response);
    }

    /**
     * Execute an ElasticSearch query and return a dictionary containing the results.
     */
    private async execute(corpus: Corpus, esQuery: EsQuery, size: number, from?: number) {
        const url = `/api/es/${corpus.name}/_search`;
        const optionDict = {
            size: size.toString()
        };
        if (from) {
            optionDict['from'] = from.toString();
        }
        const options = {
            params: new HttpParams({ fromObject: optionDict })
        };
        const body: QueryParameters = {
            es_query: esQuery
        };
        return this.http.post<SearchResponse>(url, body, options).toPromise();
    }

    /**
     * Construct the aggregator, based on kind of field
     * Date fields are aggregated in year intervals
     */
    private makeAggregation(aggregator: string, size?: number, min_doc_count?: number) {
        const aggregation = {
            terms: {
                field: aggregator,
                size,
                min_doc_count
            }
        };
        return aggregation;
    }

    private executeAggregate(corpus: Corpus, aggregationModel) {
        return this.execute(corpus, aggregationModel, 0);
    }

    /**
     * Extract relevant information from dictionary returned by ES
     *
     * @param corpus
     * @param response
     */
    private parseResponse(corpus: Corpus, response: SearchResponse): SearchResults {
        const hits = response.hits.hits;
        return {
            documents: hits.map(hit => this.hitToDocument(corpus, hit, response.hits.max_score)),
            total: response.hits.total
        };
    }

    private firstDocumentFromResults(results: SearchResults): FoundDocument {
        if (results.documents.length) {
            return _.first(results.documents);
        }
    }

    /**
     * return the id, relevance and field values of a given document
     */
    private hitToDocument(corpus: Corpus, hit: SearchHit, maxScore: number): FoundDocument {
        return new FoundDocument(this.tagService, corpus, hit, maxScore);
    }

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
