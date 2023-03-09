import {SearchFilter } from '../models/index';
import { EsQuery } from '../services';
import { SearchFilterData } from './search-filter-old';

/** This is the query object as it is saved in the database.*/
export class QueryDb {
    constructor(
        esQuery: EsQuery,
        /**
         * Name of the corpus for which the query was performed.
         */
        public corpus: string,

        /**
         * User that performed this query.
         */
        public user: number) {
        this.query_json = esQuery;
    }

    /**
     * The query id, when `undefined` it will automatically assign one on save.
     */
    public id?: number;

    /**
     * JSON string representing the query model (i.e., query text and filters, see below).
     */
    public query_json: EsQuery;
    queryModel?: QueryModel;

    /**
     * Time the first document was sent.
     */
    public started?: Date;

    /**
     * Time the last document was sent, if not aborted.
     */
    public completed?: Date;

    /**
     * Whether the download was prematurely ended.
     */
    public aborted = false;

    /**
     * Number of transferred (e.g. actually downloaded) documents. Note that this does not say anything about the size of those documents.
     */
    public transferred = 0;

    /**
     * Number of total results available for the query.
     */
    public total_results: number;
}

/** This is the client's representation of the query by the user, shared between components */
export interface QueryModel {
    queryText: string;
    fields?: string[];
    filters?: SearchFilter<SearchFilterData>[];
    sortBy?: string;
    sortAscending?: boolean;
    highlight?: number;
}

/** These are the from / size parameters emitted by the pagination component */
export interface SearchParameters {
    from: number;
    size: number;
}
