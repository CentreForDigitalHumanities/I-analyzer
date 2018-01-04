import { CorpusField } from './corpus';
import { SearchQuery } from './query';
import { FoundDocument } from './found-document';

export type SearchResults = {
    completed: boolean,
    fields?: CorpusField[],
    documents: FoundDocument[],
    /**
     * Total number of retrieved documents for this search.
     */
    retrieved: number,
    total: number,
    queryModel: SearchQuery
}

export type AggregateResults<TKey> = {
    completed: boolean,
    aggregations: {
    	key: TKey,
    	doc_count: number,
        key_as_string?: string
    }[]
}
