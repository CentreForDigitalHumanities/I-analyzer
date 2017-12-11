import { CorpusField } from './corpus';
import { FoundDocument } from './found-document'

export type SearchResults = {
    completed: boolean,
    fields?: CorpusField[],
    documents: FoundDocument[],
    /**
     * Total number of retrieved documents for this search.
     */
    retrieved: number,
    total: number
}
