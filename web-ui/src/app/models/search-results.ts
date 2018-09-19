import { CorpusField } from './corpus';
import { QueryModel } from './query';
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
    queryModel: QueryModel,
    /**
     * Id identifying this search, to be able to get more results
     */
    scrollId?: string
}

export type AggregateQueryFeedback = {
    completed: boolean,
    aggregations: AggregateData
}

export type AggregateResult = {
    key: string,
    doc_count: number,
    key_as_string?: string
}

export type AggregateData = {
    [fieldName: string]: AggregateResult[]
}