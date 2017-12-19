export class Corpus implements ElasticSearchIndex {
    constructor(
    /**
     * Internal name for referring to this corpus e.g. in URLs.
     */
        public name: string,
        /**
         * Human readable title of this corpus.
         */
        public title: string,
        /**
         * Description of the corpus to show to users.
         */
        public description: string,
        public visualize: Array<string>,
        public doctype: DocumentType,
        public index: string,
        public fields: CorpusField[],
        public minDate: Date,
        public maxDate: Date) { }
}

export type ElasticSearchIndex = {
    doctype: DocumentType,
    index: string
}

export type DocumentType = 'article';

export type CorpusField = {
    description: string,
    type: 'keyword' | 'integer' | 'text' | 'date' | 'boolean',
    hidden: boolean,
    name: string,
    searchFilter: SearchFilter | null
}

export type SearchFilter = BooleanFilter | MultipleChoiceFilter | RangeFilter | DateFilter;

type BooleanFilter = {
    description: string,
    name: 'BooleanFilter',
    falseText: string,
    trueText: string
}
type MultipleChoiceFilter = {
    description: string
    name: 'MultipleChoiceFilter',
    options: string[]
}

type RangeFilter = {
    description: string
    name: 'RangeFilter',
    lower: number,
    upper: number
}

type DateFilter = {
    description: string
    name: 'DateFilter',
    lower: Date,
    upper: Date
}
