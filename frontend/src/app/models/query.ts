import { convertToParamMap, ParamMap } from '@angular/router';
import * as _ from 'lodash';
import { combineLatest, Subject } from 'rxjs';
import { Corpus, CorpusField, EsFilter, FilterInterface, SortBy, SortConfiguration, SortDirection, Tag, } from '../models/index';
import { EsQuery } from '../models';
import { combineSearchClauseAndFilters, makeHighlightSpecification } from '../utils/es-query';
import {
    filtersFromParams, highlightFromParams, highlightToParams, omitNullParameters, queryFiltersToParams,
    queryFromParams, searchFieldsFromParams
} from '../utils/params';
import { isFieldFilter, SearchFilter } from './field-filter';
import { isTagFilter, TagFilter } from './tag-filter';
import { TagService } from '../services/tag.service';
import { makeTagSpecification } from '../utils/api-query';
import { APIQuery } from './search-requests';

/** This is the query object as it is saved in the database.*/
export class QueryDb {
    /**
     * The query id, when `undefined` it will automatically assign one on save.
     */
    public id?: number;

    /**
     * JSON string representing the query model (i.e., query text and filters, see below).
     */
    public query_json: EsQuery;
    public queryModel?: QueryModel;

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
    public aborted = false;

    /**
     * Number of transferred (e.g. actually downloaded) documents. Note that this does not say anything about the size of those documents.
     */
    public transferred = 0;

    /**
     * Number of total results available for the query.
     */
    public total_results: number;

    constructor(
        esQuery: EsQuery,
        /**
         * Name of the corpus for which the query was performed.
         */
        public corpus: string,

        /**
         * User that performed this query.
         */
        public user: number
    ) {
        this.query_json = esQuery;
    }
}

/** These are the from / size parameters emitted by the pagination component */
export interface SearchParameters {
    from: number;
    size: number;
}


export class QueryModel {
    corpus: Corpus;
	queryText: string;
	searchFields: CorpusField[];
    filters: FilterInterface[];
    sort: SortConfiguration;
    highlightSize: number;

	update = new Subject<void>();

    constructor(corpus: Corpus, params?: ParamMap, private tagService?: TagService) {
		this.corpus = corpus;
        this.filters = this.makeFilters();
        this.sort = new SortConfiguration(this.corpus);
        if (params) {
            this.setFromParams(params);
        }
        this.subscribeToFilterUpdates();
    }

    get activeFilters() {
        return this.filters.filter(f => f.active.value);
    }

    get highlightDisabled() {
        return !this.queryText;
    }

    private get fieldFilters(): SearchFilter[] {
        return this.filters.filter(isFieldFilter);
    }

	setQueryText(text?: string) {
		this.queryText = text || undefined;
		this.update.next();
	}

    addFilter(filter: FilterInterface) {
        this.setFilter(filter);
	}

    setSortBy(value: SortBy) {
        this.sort.setSortBy(value);
        this.update.next();
    }

    setSortDirection(value: SortDirection) {
        this.sort.setSortDirection(value);
        this.update.next();
    }


    removeFilter(filter: SearchFilter) {
        this.deactivateFiltersForField(filter.corpusField);
    }

    /** get an active search filter on this query for the field (undefined if none exists) */
    filterForField(field: CorpusField): SearchFilter {
        return this.fieldFilters.find(filter => filter.corpusField.name === field.name);
    }

    /** remove all filters that apply to a corpus field */
    deactivateFiltersForField(field: CorpusField) {
        this.fieldFilters.filter(filter =>
            filter.corpusField.name === field.name
        ).forEach(filter =>
            filter.deactivate()
        );
    }

    setHighlight(size?: number) {
        this.highlightSize = size || undefined;
        this.update.next();
    }

    /**
     * make a clone of the current query.
     */
	clone() {
        return new QueryModel(this.corpus, convertToParamMap(this.toQueryParams()), this.tagService);
	}

    /**
     * convert the query to a parameter map
     *
     * All query-related params are explicity listed;
     * empty parameters have value null.
     *
     */
    toRouteParam(): {[param: string]: string|null} {
        const queryTextParams =  { query: this.queryText || null };
        const searchFieldsParams = { fields: this.searchFields?.map(f => f.name).join(',') || null};
        const sortParams = this.sort.toRouteParam();
        const highlightParams = highlightToParams(this);
        const filterParams = queryFiltersToParams(this);

        return {
            ...queryTextParams,
            ...searchFieldsParams,
            ...filterParams,
            ...sortParams,
            ...highlightParams,
        };
	}

    /**
     * convert the query to a a parameter map, only
     * including properties that should actually be explicated
     * in the route. Same as query.toRouteParam() but
     * without null values.
     */
    toQueryParams(): {[param: string]: string} {
        return omitNullParameters(this.toRouteParam());
    }

    /** convert the query to an elasticsearch query */
	toEsQuery(): EsQuery {
        const filters = this.activeFilters
            .filter(isFieldFilter)
            .map(filter => filter.toEsFilter()) as EsFilter[];
        const query = combineSearchClauseAndFilters(this.queryText, filters, this.searchFields);

        const sort = this.sort.toEsQuerySort();
        const highlight = makeHighlightSpecification(this.corpus, this.queryText, this.highlightSize);

        return {
            ...query, ...sort, ...highlight,
        };
    }

    toAPIQuery(): APIQuery {
        const esQuery = this.toEsQuery();
        const tags = makeTagSpecification(this.activeFilters);
        return {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            es_query: esQuery,
            ...tags,
        };
    }

    private makeFilters(): FilterInterface[] {
        const fieldFilters: FilterInterface[] = this.corpus.fields.map(field => field.makeSearchFilter());
        if (this.tagService) {
            const tagFilter = new TagFilter(this.tagService);
            return fieldFilters.concat([tagFilter]);
        }
        return fieldFilters;
    }

    /** set the query values from a parameter map */
    private setFromParams(params: ParamMap) {
        this.queryText = queryFromParams(params);
        this.searchFields = searchFieldsFromParams(params, this.corpus);
        filtersFromParams(params, this.corpus, this.tagService)
            .forEach(this.setFilter.bind(this));
        this.sort = new SortConfiguration(this.corpus, params);
        this.highlightSize = highlightFromParams(params);
    }

    private setFilter(newFilter: FilterInterface): void {
        let currentFilter: FilterInterface;
        if (isTagFilter(newFilter)) {
            currentFilter = this.filters.find(isTagFilter);
        } else if (isFieldFilter(newFilter)) {
            currentFilter = this.filterForField(newFilter.corpusField);
        }
        currentFilter?.set(newFilter.currentData);
    }

    private subscribeToFilterUpdates() {
        this.filters.forEach(filter => {
            filter.update.subscribe(() => this.update.next());
        });
    }
}
