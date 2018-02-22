export class Query {
    constructor(
        query: SearchQuery,
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
     * JSON string sent out to ElasticSearch for this query.
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

export type SearchQuery = {
    aborted?: boolean,
    completed?: Date,
    query: SearchClause | {
        'bool': {
            must: SearchClause[],
            filter: any[],
        }
    },
    transferred?: Number
}

export type SearchClause = {
    simple_query_string: {
        query: string,
        fields?: string[],
        lenient: true,
        default_operator: 'or'
    }
} | {
    match_all: {}
};

