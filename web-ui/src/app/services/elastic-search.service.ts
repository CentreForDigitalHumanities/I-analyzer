import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { Client, ConfigOptions } from 'elasticsearch';
import { CorpusField, FoundDocument, ElasticSearchIndex, SearchResults } from '../models/index';
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

<<<<<<< HEAD
    /*makeAggregrateQuery(queryString: string | null = null, filters: any[] = [], aggregator: string): AggregateQuery {
        let query = this.makeQuery(queryString, filters);
        let agquery = {query, aggregator: {
            'terms': {
                'field': aggregator
            }
        }}
        return agquery
    }*/
=======
    private executeAggregate(index: ElasticSearchIndex, query, aggregator: string, fieldName: string = aggregator) {
        return this.connection.then((connection) => connection.client.search({
            index: index.index,
            type: index.doctype,
            size: 0,
            body: Object.assign({
                aggs: {
                    [aggregator]: {
                        terms: {
                            field: fieldName,
                            // order by quarter, ascending
                            // order: { "_term": "asc" }
                        }
                    }
                }
            }, query)
        }));
    }
>>>>>>> 7a48ef3b19d7f57a81e1f8304e3cb5efb440b4ef

    /**
     * Execute an ElasticSearch query and return a dictionary containing the results.
     */
    private execute<T>(index: ElasticSearchIndex, query, size) {
        return this.connection.then((connection) => connection.client.search<T>({
            index: index.index,
            type: index.doctype,
            size: size,
            body: query
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
                        total: response.hits.total
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

<<<<<<< HEAD
    public async search(corpusDefinition: ElasticSearchIndex, queryString: string, filters?: any[], size?: number): Promise<SearchResults> {
=======
    public async aggregate<TKey>(corpusDefinition: ElasticSearchIndex, queryString: string, aggregator: string, filters?: any[]) {
        let query = this.makeQuery(queryString, filters);
        let connection = await this.connection;
        let result = await this.executeAggregate(corpusDefinition, query, aggregator);

        // Extract relevant information from dictionary returned by ES
        let aggregations: { [key: string]: { buckets: { key: TKey, doc_count: number }[] } } = result.aggregations;
        let buckets = aggregations[aggregator].buckets;
        return {
            completed: true,
            aggregations: buckets
        };
    }

    public async search<T>(corpusDefinition: ElasticSearchIndex, queryString: string, filters?: any[], size?: number): Promise<SearchResult<T>> {
>>>>>>> 7a48ef3b19d7f57a81e1f8304e3cb5efb440b4ef
        let query = this.makeQuery(queryString, filters);
        let connection = await this.connection;
        // Perform the search
        return this.execute(corpusDefinition, query, size || connection.config.exampleQuerySize).then(result => {
            // Extract relevant information from dictionary returned by ES
            let stats = result.hits;

            let documents = stats.hits.map((hit, index) => this.hitToDocument(hit, stats.max_score, index));

            return {
                completed: true,
                total: stats.total || 0,
                retrieved: documents.length,
                documents
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
export type SearchQuery = {
    aborted?: boolean,
    completed?: Date,
    query: SearchClause | {
        'bool': {
            'must': SearchClause[],
            'filter': any[],
        }
    },
    transferred?: Number
}
export type AggregateQuery = {
    SearchQuery,
    aggs: {
        aggregator_name: {
            'terms': {
                'field': string
            }
        }
    }
}
export type SearchClause = {
    'simple_query_string': {
        'query': string,
        'lenient': true,
        'default_operator': 'or'
    }
} | {
        'match_all': {}
    };

type Connection = {
    client: Client,
    config: {
        exampleQuerySize: number,
        scrollPagesize: number,
        scrollTimeout: string
    }
};
