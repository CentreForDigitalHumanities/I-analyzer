import { EsQuery, EsQuerySorted } from './elasticsearch';


// TAGS

export interface APITagFilter {
    tags?: number[];
}


// API query format

export type APIQuery = {
    es_query: EsQuery | EsQuerySorted;
} & APITagFilter;
