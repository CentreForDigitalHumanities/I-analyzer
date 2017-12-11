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
                    host: config.host + ':' + config.port,
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
                        documents: response.hits.hits.map((hit) => this.hitToDocument(hit, response.hits.max_score)),
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

    public async search(corpusDefinition: ElasticSearchIndex, queryString: string, filters?: any[], size?: number): Promise<SearchResults> {
        let query = this.makeQuery(queryString, filters);
        let connection = await this.connection;
        // Perform the search
        return this.execute(corpusDefinition, query, size || connection.config.exampleQuerySize).then(result => {
            // Extract relevant information from dictionary returned by ES
            let stats = result.hits;

            let documents = stats.hits.map(hit => this.hitToDocument(hit, stats.max_score));

            return {
                completed: true,
                total: stats.total || 0,
                retrieved: documents.length,
                documents
            };
        });
    }

    private hitToDocument(hit: { _id: string, _score: number, _source: {} }, maxScore: number) {
        return <FoundDocument>{
            id: hit._id,
            relevance: hit._score / maxScore,
            fieldValues: hit._source
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
