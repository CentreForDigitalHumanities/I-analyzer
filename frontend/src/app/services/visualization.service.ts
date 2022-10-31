import { Injectable } from '@angular/core';
import { AggregateTermFrequencyParameters, Corpus, DateTermFrequencyParameters, NgramParameters, QueryModel, TaskResult, TimeCategory, TimelineBin } from '../models';
import { ApiService } from './api.service';
import { ElasticSearchService } from './elastic-search.service';
import { LogService } from './log.service';
import { QueryService } from './query.service';
import { UserService } from './user.service';
import { WordmodelsService } from './wordmodels.service';

@Injectable({
  providedIn: 'root'
})
export class VisualizationService {

    constructor(
        private apiService: ApiService,
        private elasticSearchService: ElasticSearchService) {
        window['apiService'] = this.apiService;
    }


    public async getWordcloudData<TKey>(fieldName: string, queryModel: QueryModel, corpus: string, size: number): Promise<any> {
        const esQuery = this.elasticSearchService.makeEsQuery(queryModel);
        return this.apiService.wordcloud({'es_query': esQuery, 'corpus': corpus, 'field': fieldName, 'size': size}).then( result => {
            return new Promise( (resolve, reject) => {
                if (result['data']) {
                    resolve({[fieldName]: result['data']});
                } else {
                    reject({error: result['message']});
                }
            });
        });
    }

    public async getWordcloudTasks<TKey>(fieldName: string, queryModel: QueryModel, corpus: string): Promise<any> {
        const esQuery = this.elasticSearchService.makeEsQuery(queryModel);
        return this.apiService.wordcloudTasks({'es_query': esQuery, 'corpus': corpus, 'field': fieldName}).then( result => {
            return new Promise( (resolve, reject) => {
                if (result['success'] === true) {
                    resolve({taskIds: result['task_ids']});
                } else {
                    reject({error: result['message']});
                }
            });
        });
    }

    public makeAggregateTermFrequencyParameters(
        corpus: Corpus, queryModel: QueryModel, fieldName: string, bins: {fieldValue: string|number, size: number}[],
    ): AggregateTermFrequencyParameters {
        const esQuery = this.elasticSearchService.makeEsQuery(queryModel);
        return {
            corpus_name: corpus.name,
            es_query: esQuery,
            field_name: fieldName,
            bins: bins.map(bin => ({field_value: bin.fieldValue, size: bin.size})),
        };
    }

    public async aggregateTermFrequencySearch(
        corpus: Corpus, queryModel: QueryModel, fieldName: string, bins: {fieldValue: string|number, size: number}[],
    ): Promise<TaskResult> {
        const params = this.makeAggregateTermFrequencyParameters(corpus, queryModel, fieldName, bins);
        return this.apiService.getAggregateTermFrequency(params);
    }

    public makeDateTermFrequencyParameters(
        corpus: Corpus, queryModel: QueryModel, fieldName: string, bins: {size: number, start_date: Date, end_date?: Date}[],
        unit: TimeCategory,
    ): DateTermFrequencyParameters {
        const esQuery = this.elasticSearchService.makeEsQuery(queryModel);
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
        corpus: Corpus, queryModel: QueryModel, fieldName: string, bins: {size: number, start_date: Date, end_date?: Date}[],
        unit: TimeCategory,
    ): Promise<TaskResult> {
        const params = this.makeDateTermFrequencyParameters(corpus, queryModel, fieldName, bins, unit);
        return this.apiService.getDateTermFrequency(params);
    }

    getNgramTasks(queryModel: QueryModel, corpusName: string, field: string, params: NgramParameters): Promise<any> {
        const esQuery = this.elasticSearchService.makeEsQuery(queryModel);
        return this.apiService.ngramTasks({
            es_query: esQuery,
            corpus_name: corpusName,
            field: field,
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
