import { EsQuery, EsQuerySorted } from './elasticsearch';

// API query format

export interface APIQuery {
    es_query: EsQuery | EsQuerySorted;
    tags?: number[];
}

// TAGS

export interface APITagFilter {
    tags?: number[];
}
