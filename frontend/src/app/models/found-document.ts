import { Corpus } from './corpus';
import { FieldValues, HighlightResult, SearchHit } from './elasticsearch';

export class FoundDocument {
    id: string;

    /** relevance score for the query;
     * in [0,1] with 1 being most relevant
     */
    relevance: number;

    /** values for fields */
    fieldValues: FieldValues;

    /** position of the document in the array of results */
    position: number;

    /** highlighted strings */
    highlight: HighlightResult;

    constructor(public corpus: Corpus, hit: SearchHit, maxScore: number = 1) {
        this.id = hit._id;
        this.relevance = hit._score / maxScore;
        this.fieldValues = Object.assign({ id: hit._id }, hit._source);
        this.highlight = hit.highlight;
    }



}
