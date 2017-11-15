import { Injectable } from '@angular/core';

import { Observable } from 'rxjs/Observable';

import { Client } from 'elasticsearch';
import { CorpusField, ElasticSearchIndex } from '../models/index';

@Injectable()
export class ElasticSearchService {
    private clientPromise: Promise<Client>;
    private scrollPageSize: number;
    private scrollTimeOut: string;

    constructor() {
        // TODO: configure client / move to wrapper service
        this.clientPromise = Promise.resolve(new Client({}));
        this.scrollPageSize = 5000;// TODO: ES_SCROLL_PAGESIZE
        this.scrollTimeOut = '3m'; // TODO: ES_SCROLL_TIMEOUT;
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
    execute<T>(index: ElasticSearchIndex, query, size) {
        return this.clientPromise.then((client) => client.search<T>({
            index: index.index,
            type: index.doctype,
            size: size,
            body: query
        }));
    }

    /**
     * Execute an ElasticSearch query and return an observable of results as dictionaries.
     * @param corpusDefinition
     * @param query
     * @param size Maximum number of hits
     */
    executeIterate<T>(corpusDefinition: ElasticSearchIndex, query: SearchQuery, size: number): Observable<FoundDocument<T>> {
        return new Observable((observer) => {
            let retrieved = 0;
            this.clientPromise.then((client) => {
                function getMoreUntilDone(error: any, response: Elasticsearch.SearchResponse<{}>) {
                    response.hits.hits.forEach(function (hit) {
                        retrieved++;

                        let doc: FoundDocument<T> = Object.apply({
                            id: hit._id
                        }, hit._source);

                        observer.next(doc);
                    });

                    if (response.hits.total !== retrieved && retrieved < size) {
                        // now we can call scroll over and over
                        client.scroll({
                            scrollId: response._scroll_id,
                            scroll: this.scrollTimeOut
                        }, getMoreUntilDone);
                    } else {
                        observer.complete();
                    }
                }

                client.search({
                    body: query,
                    index: corpusDefinition.index,
                    type: corpusDefinition.doctype,
                    size: this.scrollPageSize,
                    scroll: this.scrollTimeOut
                }, getMoreUntilDone);
            });
        });
    }

    /**
     * Iterate through some dictionaries and yield for each dictionary the values
     * of the selected fields, in given order.
     */
    documentRow<T>(document: { [id: string]: T }, fields: string[] = []): string[] {
        // TODO: move this declaration outside the scope of this function
        let _stringify = (value) => {
            if (!value) {
                return '';
            }
            if (Array.isArray(value)) {
                return value.join(', ');
            }
            if (value instanceof Date) {
                return value.toISOString(); // TODO: '%Y-%m-%d'
            }

            return String(value);
        }

        return fields.map(field => _stringify(document[field]));
    }

    // corpus_definition, query_string=None, fields=None, filters=None, n=config.ES_EXAMPLE_QUERY_SIZE
    public search<T>(corpusDefinition: ElasticSearchIndex, queryString: string, fields?: (CorpusField | string)[], filters?: any[], size = 500 /* TODO: ES_EXAMPLE_QUERY_SIZE */) {
        let query = this.makeQuery(queryString, filters);
        // Perform the search
        // TODO: logging.info('Requested example JSON for query: {}'.format(query))
        return this.execute(corpusDefinition, query, size).then(result => {
            // Extract relevant information from dictionary returned by ES
            let stats = result.hits;

            let fieldNames = fields.map(field => (<any>field).name ? (<CorpusField>field).name : <string>field);
            let rows = stats.hits.map(hit => {
                // TODO: as a function
                let doc: FoundDocument<T> = Object.apply({
                    id: hit._id
                }, hit._source);
                // TODO: WHY IS doc EMPTY??
                return this.documentRow(doc, fieldNames);
            });

            return {
                fieldNames,
                total: stats.total || 0,
                table: rows
            };
        });
    }
}

export type FoundDocument<T> = T & { ['id']: string };
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
