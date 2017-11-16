export class Query {
    constructor(
        /**
         * JSON string sent out to ElasticSearch for this query.
         */
        public query: string,

        /**
         * Name of the corpus for which the query was performed.
         */
        public corpusName: string,

        /**
         * User that performed this query.
         */
        public userId: number) {
    }

    /**
     * The query id, a placeholder or a promise for the query id (when waiting for a save).
     */
    public id: number | undefined | Promise<number> = undefined;

    /**
     * Time the first document was sent.
     * TODO: use server time
     */
    public started: Date = new Date();

    /**
     * Time the last document was sent, if not aborted.
     * TODO: use server time
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
