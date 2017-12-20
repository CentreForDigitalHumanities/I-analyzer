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
        public visualize: string[],
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
    displayName: string,
    /**
     * How the field value should be displayed.
     * text_content: Main text content of the document
     */
    displayType: 'text_content' | 'px' | 'keyword' | 'integer' | 'text' | 'date' | 'boolean',
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
