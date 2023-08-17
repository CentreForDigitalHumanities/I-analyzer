import { EsQuery, EsQuerySorted } from './elasticsearch';

export interface QueryParameters {
    es_query: EsQuery | EsQuerySorted;
    tags?: number[];
}
