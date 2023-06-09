import { ParamMap } from '@angular/router';
import * as _ from 'lodash';
import { combineLatest, Subject, Subscription } from 'rxjs';
import { Corpus, CorpusField, EsFilter, SortBy, SortConfiguration, SortDirection, } from '../models/index';
import { EsQuery } from '../services';
import { combineSearchClauseAndFilters, makeHighlightSpecification } from '../utils/es-query';
import {
    filtersFromParams, highlightFromParams, omitNullParameters, paramsHaveChanged, queryFiltersToParams,
    queryFromParams, searchFieldsFromParams
} from '../utils/params';
import { SearchFilter } from './search-filter';

/** This is the query object as it is saved in the database.*/
export class QueryDb {
    constructor(
        esQuery: EsQuery,
        /**
         * Name of the corpus for which the query was performed.
         */
        public corpus: string,

        /**
         * User that performed this query.
         */
        public user: number) {
        this.query_json = esQuery;
    }

    /**
     * The query id, when `undefined` it will automatically assign one on save.
     */
    public id?: number;

    /**
     * JSON string representing the query model (i.e., query text and filters, see below).
     */
    public query_json: EsQuery;
    queryModel?: QueryModel;

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
	filters: SearchFilter[] = [];
    sort: SortConfiguration;
    highlightSize: number;

	update = new Subject<void>();

    private filterSubscription: Subscription;

    constructor(corpus: Corpus, params?: ParamMap) {
		this.corpus = corpus;
        this.sort = new SortConfiguration(this.corpus);
        if (params) {
            this.setFromParams(params);
        }
    }

    get activeFilters() {
        return this.filters.filter(f => f.active.value);
    }

	setQueryText(text?: string) {
		this.queryText = text || undefined;
		this.update.next();
	}

	addFilter(filter: SearchFilter) {
		this.filters.push(filter);
        this.subscribeToFilterUpdates();
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
        this.removeFiltersForField(filter.corpusField);
    }

    /** get an active search filter on this query for the field (undefined if none exists) */
    filterForField(field: CorpusField): SearchFilter {
        return this.filters.find(filter => filter.corpusField.name === field.name);
    }

    /** remove all filters that apply to a corpus field */
    removeFiltersForField(field: CorpusField) {
        if (this.filterForField(field)) {
            _.remove(this.filters,
                filter => filter.corpusField.name === field.name
            );
            this.subscribeToFilterUpdates();
        }
    }

    setHighlight(size?: number) {
        this.highlightSize = size;
        this.update.next();
    }

    /**
     * make a clone of the current query.
     * optionally include querytext or a filter for the new query.
     */
	clone(queryText: string = undefined, addFilter: SearchFilter = undefined) {
		const newQuery = _.clone(this); // or cloneDeep?
        if (queryText !== undefined) {
			newQuery.setQueryText(queryText);
		}
		if (addFilter) {
			newQuery.addFilter(addFilter);
		}
        // deep clone filters so they are disconnected from the current query
        newQuery.filters = _.cloneDeep(newQuery.filters);
		return newQuery;
	}

    /**
     * convert the query to a parameter map
     *
     * All query-related params are explicity listed;
     * empty parameters have value null.
     */
    toRouteParam(): {[param: string]: string|null} {
        const queryTextParams =  { query: this.queryText || null };
        const searchFieldsParams = { fields: this.searchFields?.map(f => f.name).join(',') || null};
        const sortParams = this.sort.toRouteParam();
        const highlightParams = { highlight: this.highlightSize  || null };
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
        const filters = this.activeFilters.map(filter => filter.toEsFilter()) as EsFilter[];
        const query = combineSearchClauseAndFilters(this.queryText, filters, this.searchFields);

        const sort = this.sort.toEsQuerySort();
        const highlight = makeHighlightSpecification(this.corpus, this.queryText, this.highlightSize);

        return {
            ...query, ...sort, ...highlight
        };
	}

    /** set the query values from a parameter map */
    private setFromParams(params: ParamMap) {
        this.queryText = queryFromParams(params);
        this.searchFields = searchFieldsFromParams(params, this.corpus);
        this.filters = filtersFromParams(params, this.corpus);
        this.sort = new SortConfiguration(this.corpus, params);
        this.highlightSize = highlightFromParams(params);
    }

    private subscribeToFilterUpdates() {
        if (this.filterSubscription) {
            this.filterSubscription.unsubscribe();
        }
        if (this.filters.length) {
            this.filterSubscription = combineLatest(
                this.filters.map(f => f.data)
            ).subscribe(() => this.update.next());
        } else {
            this.filterSubscription = undefined;
            this.update.next();
        }
    }

}
