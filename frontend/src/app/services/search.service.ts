import { Injectable } from '@angular/core';

import { ApiService } from './api.service';
import { ElasticSearchService } from './elastic-search.service';
import { QueryService } from './query.service';
import {
    Corpus, QueryModel, SearchResults,
    AggregateQueryFeedback, QueryDb
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
        corpus: Corpus,
        queryModel: QueryModel,
        from: number,
        size: number
    ): Promise<SearchResults> {
        const results = await this.elasticSearchService.loadResults(
            corpus,
            queryModel,
            from,
            size
        );
        results.fields = corpus.fields.filter((field) => field.resultsOverview);
        return results;
    }

    public async search(
        queryModel: QueryModel,
        corpus: Corpus
    ): Promise<SearchResults> {
        const user = await this.authService.getCurrentUserPromise();
        const esQuery = queryModel.toEsQuery();
        const query = new QueryDb(esQuery, corpus.name, user.id);
        query.started = new Date(Date.now());
        const results = await this.elasticSearchService.search(
            corpus,
            queryModel
        );
        query.total_results = results.total.value;
        query.completed = new Date(Date.now());
        this.queryService.save(query);

        return {
            fields: corpus.fields.filter((field) => field.resultsOverview),
            total: results.total,
            documents: results.documents,
        } as SearchResults;
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

}
