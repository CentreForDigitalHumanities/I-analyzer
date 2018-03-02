import { SearchFilterData } from '../models/index';

/** This is the query object as it is saved in the database.*/
export class Query {
    constructor(
        query: QueryModel,
        /**
         * Name of the corpus for which the query was performed.
         */
        public corpusName: string,

        /**
         * User that performed this query.
         */
        public userId: number) {
        this.query = JSON.stringify(query);
    }

    /**
     * The query id, when `undefined` it will automatically assign one on save.
     */
    public id?: number;

    /**
     * JSON string representing the query model (i.e., query text and filters, see below).
     */
    public query: string;

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
    public aborted: boolean = false;

    /**
     * Number of transferred (e.g. actually downloaded) documents. Note that this does not say anything about the size of those documents.
     */
    public transferred: number = 0
}

/** This is the client's representation of the query by the user, shared between components */
export type QueryModel = {
    queryText: string,
    filters?: SearchFilterData [];
}
