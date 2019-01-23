import { SearchFilterData } from './search-filter-data';

export class Corpus implements ElasticSearchIndex {
    constructor(
        public serverName,
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
        public doctype: DocumentType,
        public index: string,
        public fields: CorpusField[],
        public minDate: Date,
        public maxDate: Date,
        public image: string,
        public scan_image_type: string,
        public allow_image_download: boolean,
        public descriptionpage?: string) { }

}

export type ElasticSearchIndex = {
    doctype: DocumentType,
    index: string,
    serverName: string
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
    resultsOverview?: boolean,
    csvCore?: boolean,
    searchFieldCore?: boolean,
    visualizationType?: string,
    visualizationSort?: string,
    hidden: boolean,
    sortable: boolean,
    searchable: boolean,
    name: string,
    searchFilter: SearchFilter | null
}

export type QueryField = CorpusField & {
    data: SearchFilterData,
    useAsFilter: boolean,
    visible: boolean
};

export type SearchFilter = BooleanFilter | MultipleChoiceFilter | RangeFilter | DateFilter;

type BooleanFilter = {
    description: string,
    name: 'BooleanFilter',
    falseText: string,
    trueText: string
}

export type MultipleChoiceFilter = {
    description: string
    name: 'MultipleChoiceFilter',
    options: string[],
    counts?: any[]
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
