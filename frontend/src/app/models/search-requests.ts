import { EsQuery } from './elasticsearch';

export interface QueryParameters {
    es_query: EsQuery;
    tags?: number[];
}
