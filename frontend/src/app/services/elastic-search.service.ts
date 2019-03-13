import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { Client, SearchResponse } from 'elasticsearch';
import { FoundDocument, ElasticSearchIndex, QueryModel, SearchResults, AggregateResult, AggregateQueryFeedback, SearchFilter } from '../models/index';

import { ApiRetryService } from './api-retry.service';
import { CorpusSelectionComponent } from '../corpus-selection/corpus-selection.component';

type Connections = { [serverName: string]: Connection };

@Injectable()
export class ElasticSearchService {
    private connections: Promise<Connections>;

    constructor(apiRetryService: ApiRetryService) {
        this.connections = apiRetryService.requireLogin(api => api.esConfig()).then(configs =>
            configs.reduce((connections: Connections, config) => {
                connections[config.name] = {
                    config,
                    client: new Client({
                        host: config.host + (config.port ? `:${config.port}` : ''),
                    })
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
            type: index.doctype,
            size: 0,
            body: aggregationModel
        }));
    }

    /**
     * Execute an ElasticSearch query and return a dictionary containing the results.
     */
    private async execute<T>(index: ElasticSearchIndex, esQuery: EsQuery, size: number) {
        let connection = (await this.connections)[index.serverName];
        return connection.client.search<T>({
            index: index.index,
            type: index.doctype,
            size: size,
            body: esQuery,
            scroll: connection.config.scrollTimeout
        });
    }

    /**
     * Execute an ElasticSearch query and return an observable of search results.
     * @param corpusDefinition
     * @param query
     * @param size Maximum number of hits
     */
    searchObservable(corpusDefinition: ElasticSearchIndex, queryModel: QueryModel, size: number): Observable<SearchResults> {
        return new Observable((observer) => {
            let retrieved = 0;
            let esQuery = this.makeEsQuery(queryModel);
            this.connections.then((connections) => {
                let connection = connections[corpusDefinition.serverName];
                let getPageSize = () => {
                    let pageSize = connection.config.scrollPagesize;
                    let left = Math.min(size, retrieved + pageSize) - retrieved;
                    return Math.min(left, pageSize);
                }

                let getMoreUntilDone = (error: any, response: SearchResponse<{}>) => {
                    // only get the number of results specified in the configuration
                    let pageSize = getPageSize();
                    let result = this.parseResponse(response, queryModel, retrieved, pageSize);
                    retrieved = result.retrieved;

                    if (getPageSize() > 0 && !result.completed && retrieved < size) {
                        // now we can call scroll over and over
                        observer.next(result);
                        connection.client.scroll({
                            scrollId: response._scroll_id,
                            scroll: connection.config.scrollTimeout
                        }, getMoreUntilDone);
                    } else {
                        result.completed = true;
                        observer.next(result);
                        observer.complete();
                    }
                }

                connection.client.search({
                    body: esQuery,
                    index: corpusDefinition.index,
                    type: corpusDefinition.doctype,
                    size: getPageSize(),
                    scroll: connection.config.scrollTimeout
                }, getMoreUntilDone);
            });
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

    public async search(corpusDefinition: ElasticSearchIndex, queryModel: QueryModel, size?: number): Promise<SearchResults> {
        let connection = (await this.connections)[corpusDefinition.serverName];
        let esQuery = this.makeEsQuery(queryModel);
        // Perform the search
        let response = await this.execute(corpusDefinition, esQuery, size || connection.config.overviewQuerySize);
        return this.parseResponse(response, queryModel, 0);
    }

    /**
    * Clear ES's scroll ID to free ES resources
    */
    public async clearScroll(corpusDefinition: ElasticSearchIndex, existingResults: SearchResults): Promise<void> {
        if (existingResults.scrollId) {
            let connection = (await this.connections)[corpusDefinition.serverName];
            connection.client.clearScroll({scrollId: existingResults.scrollId})
        }
    }

    /**
     * Loads more results and returns an object containing the existing and newly found documents.
     */
    public async loadMore(corpusDefinition: ElasticSearchIndex, existingResults: SearchResults): Promise<SearchResults> {
        let connection = (await this.connections)[corpusDefinition.serverName];
        
        try {
            let response = await connection.client.scroll({
                scrollId: existingResults.scrollId,
                scroll: connection.config.scrollTimeout
            });

            let additionalResults = await this.parseResponse(response, existingResults.queryModel, existingResults.retrieved);
            additionalResults.documents = existingResults.documents.concat(additionalResults.documents);
            additionalResults.fields = existingResults.fields;
            return additionalResults;
        }
        catch (e) {
            // Check if this is the ES exception we except (scroll / search context is missing)
            if (e.message.indexOf("search_context_missing_exception") >= 0) {                
                let size = existingResults.retrieved + connection.config.overviewQuerySize;
                let results = await this.search(corpusDefinition, existingResults.queryModel, size);
                results.fields = existingResults.fields;
                return results;
            } else {
                throw e;
            }
        }
    }

    /**
     * Extract relevant information from dictionary returned by ES
     * @param response
     * @param queryModel
     * @param alreadyRetrieved
     * @param completed
     */
    private parseResponse(response: SearchResponse<{}>, queryModel: QueryModel, alreadyRetrieved: number = 0, pageSize: number | null = null): SearchResults {
        let hits = pageSize != null && response.hits.hits.length > pageSize ? response.hits.hits.slice(0, pageSize) : response.hits.hits;
        let retrieved = alreadyRetrieved + (pageSize != null ? Math.min(pageSize, hits.length) : hits.length);
        return {
            completed: response.hits.total <= retrieved,
            documents: hits.map((hit, index) => this.hitToDocument(hit, response.hits.max_score, alreadyRetrieved + index)),
            retrieved,
            total: response.hits.total,
            queryModel,
            scrollId: response._scroll_id
        }
    }

    /**
     * @param index 0-based index of this document
     */
    private hitToDocument(hit: { _id: string, _score: number, _source: {} }, maxScore: number, index: number) {
        return <FoundDocument>{
            id: hit._id,
            relevance: hit._score / maxScore,
            fieldValues: Object.assign({ id: hit._id }, hit._source),
            position: index + 1
        };
    }

    /**
    * Convert filters from query model into elasticsearch form
    */
    private mapFilters(filters: SearchFilter[]) {
        return filters.map(filter => {
            switch (filter.currentData.filterType) {
                case "BooleanFilter":
                    return { 'term': { [filter.fieldName]: filter.currentData.checked } };
                case "MultipleChoiceFilter":
                    return { 'terms': { [filter.fieldName]: filter.currentData.selected } };
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