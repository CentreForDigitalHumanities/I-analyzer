import { Component, Input, OnChanges } from '@angular/core';

import { DownloadService, NotificationService } from '../services/index';
import { Corpus, CorpusField, QueryModel } from '../models/index';
import { Url } from 'url';

@Component({
  selector: 'ia-download',
  templateUrl: './download.component.html',
  styleUrls: ['./download.component.scss']
})
export class DownloadComponent implements OnChanges {
    @Input() public corpus: Corpus;
    @Input() public queryModel: QueryModel;
    @Input() public resultsCount: number;
    @Input() public hasLimitedResults: boolean;
    @Input() public downloadLimit: string;
    @Input() public route: string;

    public selectedCsvFields: CorpusField[];
    public availableCsvFields: CorpusField[];

    public isDownloading: boolean;
    public isModalActive: boolean = false;
    public isModalActiveError: boolean = false;
    
    private resultsCutoff = 1000;
    
    constructor(private downloadService: DownloadService, private notificationService: NotificationService) { }

    ngOnChanges() {
        this.availableCsvFields = Object.values(this.corpus.fields).filter(field => field.downloadable);
    }

    /**
     * called by download csv button. Large files are rendered in backend via Celery async task and an email is send with download link from backend
     */
    public choose_download_method() {
        if (this.resultsCount < this.resultsCutoff) {
            this.isDownloading = true;
            this.downloadService.download(this.corpus, this.queryModel, this.getCsvFields(), this.resultsCount, this.route).then( results => { 
                this.isDownloading = false;
            }).catch( error => {
                this.isDownloading = false;
                this.notificationService.showMessage(error);
            })
        }
        else {
            this.downloadService.downloadTask(this.corpus, this.queryModel, this.getCsvFields(), this.route).then( results => {
                if (results.success===false) {
                    this.notificationService.showMessage(results.message);
                }
                else {
                    this.notificationService.showMessage("Downloading CSV file... A link will be sent to your email address shortly.", 'success');
                }
            }).catch( error => {
                this.notificationService.showMessage(error);
            });
        }
    }

    public selectCsvFields(selection: CorpusField[]) {
        this.selectedCsvFields = selection;
    }

    private getCsvFields(): CorpusField[] {
        if (this.selectedCsvFields === undefined) {
            return this.corpus.fields.filter(field => field.csvCore);
        }
        else return this.selectedCsvFields;
    }


}
