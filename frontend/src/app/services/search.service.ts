import { Injectable } from '@angular/core';

import { ApiService } from './api.service';
import { ElasticSearchService } from './elastic-search.service';
import { QueryService } from './query.service';
import {
    Corpus, QueryModel, SearchResults,
    AggregateQueryFeedback, QueryDb, User
} from '../models/index';
import { AuthService } from './auth.service';


@Injectable()
export class SearchService {
    constructor(
        private apiService: ApiService,
        private authService: AuthService,
        private elasticSearchService: ElasticSearchService,
        private queryService: QueryService,
    ) {
        window['apiService'] = this.apiService;
    }

    /**
     * Load results for requested page
     */
    public async loadResults(
        queryModel: QueryModel,
        from: number,
        size: number
    ): Promise<SearchResults> {
        const results = await this.elasticSearchService.loadResults(
            queryModel,
            from,
            size
        );
        results.fields = queryModel.corpus.fields.filter((field) => field.resultsOverview);
        return results;
    }

    public async search(queryModel: QueryModel
    ): Promise<SearchResults> {
        const user = await this.authService.getCurrentUserPromise();
        const request = () => this.elasticSearchService.search(queryModel);

        let resultsPromise: Promise<SearchResults>;

        if (user.enableSearchHistory) {
            resultsPromise = this.searchAndSave(queryModel, user, request);
        } else {
            resultsPromise = request();
        }

        return resultsPromise.then(results =>
            this.filterResultsFields(results, queryModel)
        );
    }

    public async aggregateSearch<TKey>(
        corpus: Corpus,
        queryModel: QueryModel,
        aggregators: any
    ): Promise<AggregateQueryFeedback> {
        return this.elasticSearchService.aggregateSearch<TKey>(
            corpus,
            queryModel,
            aggregators
        );
    }

    public async dateHistogramSearch<TKey>(
        corpus: Corpus,
        queryModel: QueryModel,
        fieldName: string,
        timeInterval: string
    ): Promise<AggregateQueryFeedback> {
        return this.elasticSearchService.dateHistogramSearch<TKey>(
            corpus,
            queryModel,
            fieldName,
            timeInterval
        );
    }

    /** execute a search request and save the action to the search history log */
    private searchAndSave(queryModel: QueryModel, user: User, searchRequest: () => Promise<SearchResults>): Promise<SearchResults> {
        return this.recordTime(searchRequest).then(([results, started, completed]) => {
            this.saveQuery(queryModel, user, results, started, completed);
            return results;
        });
    }

    /** execute a promise while noting the start and end time */
    private recordTime<T>(makePromise: () => Promise<T>): Promise<[result: T, started: Date, completed: Date]> {
        const started = new Date(Date.now());

        return makePromise().then(result => {
            const completed = new Date(Date.now());
            return [result, started, completed];
        });
    }

    /** save query data to search history */
    private saveQuery(queryModel: QueryModel, user: User, results: SearchResults, started: Date, completed: Date) {
        const esQuery = queryModel.toEsQuery();
        const query = new QueryDb(esQuery, queryModel.corpus.name, user.id);
        query.started = started;
        query.total_results = results.total.value;
        query.completed = completed;
        this.queryService.save(query);
    }

    /** filter search results for fields included in resultsOverview of the corpus */
    private filterResultsFields(results: SearchResults, queryModel: QueryModel): SearchResults {
        return {
            fields: queryModel.corpus.fields.filter((field) => field.resultsOverview),
            total: results.total,
            documents: results.documents,
        } as SearchResults;
    }
}
