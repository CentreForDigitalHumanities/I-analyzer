import * as _ from 'lodash';
import { AdHocFilter, BooleanFilter, DateFilter, MultipleChoiceFilter, RangeFilter, SearchFilter } from './search-filter';
import { FilterOptions } from './search-filter-options';

// corresponds to the corpus definition on the backend.
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
        public index: string,
        public fields: CorpusField[],
        public minDate: Date,
        public maxDate: Date,
        public image: string,
        public scan_image_type: string,
        public allow_image_download: boolean,
        public word_models_present: boolean,
        public languages: string[],
        public category: string,
        public descriptionpage?: string,
        public documentContext?: DocumentContext,
    ) { }

    get minYear(): number {
        return this.minDate.getFullYear();
    }

    get maxYear(): number {
        return this.maxDate.getFullYear();
    }

    get displayLanguages(): string {
        return this.languages.join(', '); // may have to truncate long lists?
    }
}

export interface ElasticSearchIndex {
    index: string;
    serverName: string;
}


export interface DocumentContext {
    contextFields: CorpusField[];
    sortField?: CorpusField;
    sortDirection?: 'asc'|'desc';
    displayName: string;
}

export type FieldDisplayType = 'text_content' | 'px' | 'keyword' | 'integer' | 'text' | 'date' | 'boolean';

/** Corpus field info as sent by the backend api */
export interface ApiCorpusField {
    name: string;
    display_name: string;
    display_type: FieldDisplayType;
    description: string;
    search_filter: FilterOptions | null;
    results_overview: boolean;
    csv_core: boolean;
    search_field_core: boolean;
    visualizations: string[];
    visualization_sort: string | null;
    es_mapping: any;
    positionsOffsets?: boolean;
    indexed: boolean;
    hidden: boolean;
    required: boolean;
    sortable: boolean;
    primary_sort: boolean;
    searchable: boolean;
    downloadable: boolean;
}

export class CorpusField {
    description: string;
    displayName: string;
    /**
     * How the field value should be displayed.
     * text_content: Main text content of the document
     */
    displayType: FieldDisplayType;
    resultsOverview?: boolean;
    csvCore?: boolean;
    searchFieldCore?: boolean;
    visualizations?: string[];
    visualizationSort?: string;
    multiFields?: string[];
    positionsOffsets?: boolean;
    hidden: boolean;
    sortable: boolean;
    primarySort: boolean;
    searchable: boolean;
    downloadable: boolean;
    name: string;
    filterOptions: FilterOptions;
    mappingType: 'text' | 'keyword' | 'boolean' | 'date' | 'integer' | null;

    constructor(data: ApiCorpusField) {
        this.description = data.description;
        this.displayName = data.display_name || data.name;
        this.displayType = data.display_type || data['es_mapping']?.type;
        this.resultsOverview = data.results_overview;
        this.csvCore = data.csv_core;
        this.searchFieldCore = data.search_field_core;
        this.visualizations = data.visualizations;
        this.visualizationSort = data.visualization_sort;
        this.multiFields = data['es_mapping']?.fields
            ? Object.keys(data['es_mapping'].fields)
            : undefined;
        this.positionsOffsets = data['es_mapping']?.term_vector ? true : false;
        this.hidden = data.hidden;
        this.sortable = data.sortable;
        this.primarySort = data.primary_sort;
        this.searchable = data.searchable;
        this.downloadable = data.downloadable;
        this.name = data.name;
        this.filterOptions = data['search_filter'];
        this.mappingType = data.es_mapping?.type;
    }

    /** make a SearchFilter for this field */
    makeSearchFilter(): SearchFilter {
		const filterClasses = {
			DateFilter,
			MultipleChoiceFilter,
			BooleanFilter,
			RangeFilter,
		};
		const Filter = _.get(
			filterClasses,
			this.filterOptions?.name,
			AdHocFilter
		);
		return new Filter(this);
	}
}
