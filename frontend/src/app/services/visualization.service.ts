import { Injectable } from '@angular/core';
import {
    AggregateResult,
    AggregateTermFrequencyParameters,
    Corpus,
    DateTermFrequencyParameters,
    NgramParameters,
    QueryModel,
    TaskResult,
    TimeCategory,
} from '../models';
import { ApiService } from './api.service';
import { ElasticSearchService } from './elastic-search.service';

@Injectable({
  providedIn: 'root'
})
export class VisualizationService {

    constructor(
        private apiService: ApiService) {
        window['apiService'] = this.apiService;
    }


    public async getWordcloudData(fieldName: string, queryModel: QueryModel, corpus: Corpus, size: number):
        Promise<AggregateResult[]> {
        const esQuery = queryModel.toEsQuery();
        return this.apiService.wordCloud({
            es_query: esQuery,
            corpus: corpus.name,
            field: fieldName,
            size,
        });
    }

    public async getWordcloudTasks<TKey>(fieldName: string, queryModel: QueryModel, corpus: string): Promise<string[]> {
        const esQuery = queryModel.toEsQuery();
        return this.apiService.wordcloudTasks({es_query: esQuery, corpus, field: fieldName})
            .then(result =>result['task_ids']);
    }

    public makeAggregateTermFrequencyParameters(
        corpus: Corpus, queryModel: QueryModel, fieldName: string, bins: {fieldValue: string|number; size: number}[],
    ): AggregateTermFrequencyParameters {
        const esQuery = queryModel.toEsQuery();
        return {
            corpus_name: corpus.name,
            es_query: esQuery,
            field_name: fieldName,
            bins: bins.map(bin => ({field_value: bin.fieldValue, size: bin.size})),
        };
    }

    public async aggregateTermFrequencySearch(
        corpus: Corpus, queryModel: QueryModel, fieldName: string, bins: {fieldValue: string|number; size: number}[],
    ): Promise<TaskResult> {
        const params = this.makeAggregateTermFrequencyParameters(corpus, queryModel, fieldName, bins);
        return this.apiService.getAggregateTermFrequency(params);
    }

    public makeDateTermFrequencyParameters(
        corpus: Corpus, queryModel: QueryModel, fieldName: string, bins: {size: number; start_date: Date; end_date?: Date}[],
        unit: TimeCategory,
    ): DateTermFrequencyParameters {
        const esQuery = queryModel.toEsQuery();
        return {
            corpus_name: corpus.name,
            es_query: esQuery,
            field_name: fieldName,
            bins: bins.map(bin => ({
                start_date: bin.start_date.toISOString().slice(0, 10),
                end_date: bin.end_date ? bin.end_date.toISOString().slice(0, 10) : null,
                size: bin.size,
            })),
            unit,
        };
    }

    public async dateTermFrequencySearch<TKey>(
        corpus: Corpus, queryModel: QueryModel, fieldName: string, bins: {size: number; start_date: Date; end_date?: Date}[],
        unit: TimeCategory,
    ): Promise<TaskResult> {
        const params = this.makeDateTermFrequencyParameters(corpus, queryModel, fieldName, bins, unit);
        return this.apiService.getDateTermFrequency(params);
    }

    getNgramTasks(queryModel: QueryModel, corpus: Corpus, field: string, params: NgramParameters): Promise<TaskResult> {
        const esQuery = queryModel.toEsQuery();
        return this.apiService.ngramTasks({
            es_query: esQuery,
            corpus_name: corpus.name,
            field,
            ngram_size: params.size,
            term_position: params.positions,
            freq_compensation: params.freqCompensation,
            subfield: params.analysis,
            max_size_per_interval: params.maxDocuments,
            number_of_ngrams: params.numberOfNgrams,
            date_field: params.dateField,
        });
    }


}
