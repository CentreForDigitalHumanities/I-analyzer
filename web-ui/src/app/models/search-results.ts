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

export type AggregateResults = {
    completed: boolean,
    aggregations: { 
    	key: string, 
    	doc_count: number
    }[]
}