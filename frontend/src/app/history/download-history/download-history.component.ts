import { Component, OnInit } from '@angular/core';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import * as _ from 'lodash';
import { SelectItem } from 'primeng/api';
import { Corpus, Download, DownloadParameters, DownloadType, QueryModel } from '../../models';
import { ApiService, CorpusService, ElasticSearchService, EsQuery } from '../../services';
import { HistoryDirective } from '../history.directive';

@Component({
    selector: 'ia-download-history',
    templateUrl: './download-history.component.html',
    styleUrls: ['./download-history.component.scss']
})
export class DownloadHistoryComponent extends HistoryDirective implements OnInit {
    downloads: Download[];

    faDownload = faDownload;

    constructor(private apiService: ApiService, corpusService: CorpusService, private elasticSearchService: ElasticSearchService) {
        super(corpusService);
    }

    ngOnInit(): void {
        this.retrieveCorpora();
        this.apiService.downloads()
            .then(downloadHistory => this.downloads = this.sortByDate(downloadHistory))
            .catch(err => console.error(err));
    }

    downloadLink(download: Download): string {
        return '/api/csv/' + download.filename;
    }

    downloadType(type: DownloadType): string {
        const displayNames = {
            'search_results': 'Search results',
            'date_term_frequency': 'Term frequency',
            'aggregate_term_frequency': 'Term frequency'
            // timeline/histogram distinction is relevant for backend but not for the user
        }
        return displayNames[type];
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
