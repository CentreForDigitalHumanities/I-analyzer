import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { Client, ConfigOptions } from 'elasticsearch';
import { CorpusField, FoundDocument, ElasticSearchIndex, SearchQuery, SearchClause, SearchResults, AggregateResults } from '../models/index';
import { ApiService } from './api.service';

@Injectable()
export class ElasticSearchService {
    private connection: Promise<Connection>;

    constructor(apiService: ApiService) {
        this.connection = apiService.esConfig().then(config => {
            return {
                config,
                client: new Client({
                    host: config.host + (config.port ? `:${config.port}` : ''),
                })
            };
        });
    }

    /**
     * Construct a dictionary representing an ES query.
     * @param queryString Read as the `simple_query_string` DSL of standard ElasticSearch.
     * @param filters A list of dictionaries representing the ES DSL.
     */
    makeQuery(queryString: string | null = null, filters: any[] = []): SearchQuery {
        let clause: SearchClause = queryString ? {
            'simple_query_string': {
                'query': queryString,
                'lenient': true,
                'default_operator': 'or'
            }
        } : {
                'match_all': {}
            };

        if (filters) {
            return {
                'query': {
                    'bool': {
                        'must': [clause],
                        'filter': filters,
                    }
                }
            }
        } else {
            return {
                'query': clause
            }
        }
    }


    /**
    * Construct the aggregator, based on kind of field
    * Date fiels are aggregated in year intervals
    */
    makeAggregation(aggregator: string, aggregatorName: string = aggregator){
        let aggregation: any;
        if (aggregator=="date") { 
            aggregation = {
                aggs: {
                    [aggregatorName]: {
                            date_histogram: {
                                field: aggregator,
                                interval:"year",
                                format:"yyyy"
                        }
                    }
                }
            }
        }
        else { 
            aggregation = {
                aggs: {
                    [aggregatorName]: {
                        terms: {
                            field: aggregator
                        }
                    }
                }
            }
        }
        return aggregation;
        }
    

    private executeAggregate(index: ElasticSearchIndex, aggregationModel) {
        return this.connection.then((connection) => connection.client.search({
            index: index.index,
            type: index.doctype,
            size: 0,
            body: aggregationModel
        }));
    }

    /**
     * Execute an ElasticSearch query and return a dictionary containing the results.
     */
    private execute<T>(index: ElasticSearchIndex, queryModel, size) {
        return this.connection.then((connection) => connection.client.search<T>({
            index: index.index,
            type: index.doctype,
            size: size,
            body: queryModel
        }));
    }

    /**
     * Execute an ElasticSearch query and return an observable of search results.
     * @param corpusDefinition
     * @param query
     * @param size Maximum number of hits
     */
    searchObservable(corpusDefinition: ElasticSearchIndex, query: SearchQuery, size: number): Observable<SearchResults> {
        return new Observable((observer) => {
            let retrieved = 0;
            this.connection.then((connection) => {
                let getMoreUntilDone = (error: any, response: Elasticsearch.SearchResponse<{}>) => {
                    let result: SearchResults = {
                        completed: false,
                        documents: response.hits.hits.map((hit, index) => this.hitToDocument(hit, response.hits.max_score, retrieved + index)),
                        retrieved: retrieved += response.hits.hits.length,
                        total: response.hits.total,
                        queryModel: query
                    }

                    if (response.hits.total !== retrieved && retrieved < size) {
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
                    body: query,
                    index: corpusDefinition.index,
                    type: corpusDefinition.doctype,
                    size: connection.config.scrollPagesize,
                    scroll: connection.config.scrollTimeout
                }, getMoreUntilDone);
            });
        });
    }


    public async aggregateSearch<TKey>(corpusDefinition: ElasticSearchIndex, queryModel: SearchQuery, aggregator: string): Promise<AggregateResults<TKey>> {
        let aggregation = this.makeAggregation(aggregator);

        let connection = await this.connection;
        let aggregationModel = Object.assign(aggregation, queryModel);

        let result = await this.executeAggregate(corpusDefinition, aggregationModel);

        // Extract relevant information from dictionary returned by ES
        let aggregations: { [key: string]: { buckets: { key: TKey, doc_count: number, key_as_string?: string }[] } } = result.aggregations;
        let buckets = aggregations[aggregator].buckets;
        return {
            completed: true,
            aggregations: buckets
        };
    }

    public async search<T>(corpusDefinition: ElasticSearchIndex, queryModel: SearchQuery, size?: number): Promise<SearchResults> {
        let connection = await this.connection;
        // Perform the search
        return this.execute(corpusDefinition, queryModel, size || connection.config.exampleQuerySize).then(result => {
            // Extract relevant information from dictionary returned by ES
            let stats = result.hits;

            let documents = stats.hits.map((hit, index) => this.hitToDocument(hit, stats.max_score, index));

            return {
                completed: true,
                total: stats.total || 0,
                retrieved: documents.length,
                documents,
                queryModel
            };
        });
    }

    /**
     * @param index 0-based index of this document
     */
    private hitToDocument(hit: { _id: string, _score: number, _source: {} }, maxScore: number, index: number) {
        return <FoundDocument>{
            id: hit._id,
            relevance: hit._score / maxScore,
            fieldValues: hit._source,
            position: index + 1
        };
    }
}

type Connection = {
    client: Client,
    config: {
        exampleQuerySize: number,
        scrollPagesize: number,
        scrollTimeout: string
    }
};