import { EsQuery } from './elasticsearch';


// TAGS

export interface APITagFilter {
    tags?: number[];
}


// API query format

export type APIQuery = {
    es_query: EsQuery;
} & APITagFilter;
