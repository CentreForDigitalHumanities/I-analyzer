import { Component, OnInit } from '@angular/core';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import * as _ from 'lodash';
import { SelectItem } from 'primeng/api';
import { Corpus, Download, DownloadParameters, QueryModel } from '../models';
import { ApiService, CorpusService, ElasticSearchService, EsQuery } from '../services';

@Component({
    selector: 'ia-download-history',
    templateUrl: './download-history.component.html',
    styleUrls: ['./download-history.component.scss']
})
export class DownloadHistoryComponent implements OnInit {
    private corpora: Corpus[];
    corpusMenuItems: SelectItem[];
    downloads: Download[];

    faDownload = faDownload;

    constructor(private apiService: ApiService, private corpusService: CorpusService, private elasticSearchService: ElasticSearchService) { }

    ngOnInit(): void {
        this.corpusService.get().then((items) => {
            this.corpora = items;
            this.corpusMenuItems = items.map(corpus => ({ 'label': corpus.name, 'value': corpus.name }) );
        }).catch(error => {
            console.log(error);
        });

        this.apiService.downloads()
            .then(result => this.downloads = result)
            .catch(err => console.error(err));
    }

    downloadLink(download: Download): string {
        return '/api/csv/' + download.filename;
    }

    queryText(download: Download): string {
        const queryModel = this.getQueryModel(download);
        return queryModel.queryText;
    }

    getQueryModel(download: Download): QueryModel {
        const parameters: DownloadParameters = JSON.parse(download.parameters);
        const esQuery =  'es_query' in parameters ?
            parameters.es_query : parameters[0].es_query;
        const corpus = this.corpora.find(corpus => corpus.name == download.corpus);
        return this.elasticSearchService.esQueryToQueryModel(esQuery, corpus);
    }

    getFields(download: Download): string {
        const parameters: DownloadParameters = JSON.parse(download.parameters);
        const fieldNames =  'fields' in parameters ?
            parameters.fields : [parameters[0].field_name];
        const corpus = this.corpora.find(corpus => corpus.name == download.corpus);
        const fields = fieldNames.map(fieldName =>
            corpus.fields.find(field => field.name === fieldName).displayName
        )
        return _.join(fields, ', ')
    }

}
