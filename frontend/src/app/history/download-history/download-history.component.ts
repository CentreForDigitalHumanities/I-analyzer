import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { esQueryToQueryModel } from '../../utils/es-query';
import { Download, DownloadOptions, DownloadParameters, DownloadType, QueryModel } from '../../models';
import { ApiService, CorpusService, DownloadService, NotificationService } from '../../services';
import { HistoryDirective } from '../history.directive';
import { findByName } from '../../utils/utils';
import { actionIcons } from '../../shared/icons';

@Component({
    selector: 'ia-download-history',
    templateUrl: './download-history.component.html',
    styleUrls: ['./download-history.component.scss']
})
export class DownloadHistoryComponent extends HistoryDirective implements OnInit {
    downloads: Download[];

    actionIcons = actionIcons;

    itemToDownload: Download;

    constructor(
        private downloadService: DownloadService,
        private apiService: ApiService,
        corpusService: CorpusService,
        private notificationService: NotificationService
    ) {
        super(corpusService);
    }

    ngOnInit(): void {
        this.retrieveCorpora();
        this.apiService.downloads()
            .then(downloadHistory => this.downloads = this.sortByDate(downloadHistory))
            .catch(err => console.error(err));
    }

    downloadType(type: DownloadType): string {
        const displayNames = {
            search_results: 'Search results',
            date_term_frequency: 'Term frequency',
            aggregate_term_frequency: 'Term frequency',
            ngram: 'Neighbouring words'
            // timeline/histogram distinction is relevant for backend but not for the user
        };
        return displayNames[type];
    }

    queryText(download: Download): string {
        const queryModels = this.getAllQueryModels(download);
        const queryTexts = queryModels.map(model => model.queryText);
        return _.join(queryTexts, ', ');
    }

    getAllQueryModels(download: Download): QueryModel[] {
        const esQueries =  'es_query' in download.parameters ?
            [download.parameters.es_query] : download.parameters.map(p => p.es_query);
        const corpus = findByName(this.corpora, download.corpus);
        return esQueries.map(esQuery => esQueryToQueryModel(esQuery, corpus));
    }


    getQueryModel(download: Download): QueryModel {
        const queryModels = this.getAllQueryModels(download);
        return queryModels[0];
    }

    getFields(download: Download): string {
        const parameters: DownloadParameters = download.parameters;
        const fieldNames =  'fields' in parameters ?
            parameters.fields : [parameters[0].field_name];
        const corpus = findByName(this.corpora, download.corpus);
        const fields = fieldNames.map(fieldName =>
            findByName(corpus.fields, fieldName).displayName
        );
        return _.join(fields, ', ');
    }

    downloadFile(download: Download, options: DownloadOptions) {
        this.downloadService.retrieveFinishedDownload(download.id, options).then( result => {
            if (result.status === 200) {
                saveAs(result.body, download.filename);
                this.itemToDownload = undefined;
            } else {
                this.downloadFailed(result);
            }
        }).catch(this.downloadFailed.bind(this));
    }

    downloadFailed(result) {
        console.error(result);
        this.notificationService.showMessage('could not download file', 'danger');
        this.itemToDownload = undefined;
    }
}
