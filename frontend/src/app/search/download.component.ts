import { Component, Input, OnInit } from '@angular/core';

import { DownloadService, NotificationService } from '../services/index';
import { Corpus, CorpusField, QueryModel } from '../models/index';

@Component({
  selector: 'ia-download',
  templateUrl: './download.component.html',
  styleUrls: ['./download.component.scss']
})
export class DownloadComponent implements OnInit {
    @Input() public corpus: Corpus;
    @Input() public queryModel: QueryModel;
    @Input() public resultsCount: number;
    @Input() public hasLimitedResults: boolean;
    @Input() public downloadLimit: string;

    public selectedCsvFields: CorpusField[];
    public availableCsvFields: CorpusField[];

    public isDownloading: boolean;
    public isModalActive: boolean = false;
    public isModalActiveError: boolean = false;
    
    constructor(private downloadService: DownloadService, private notificationService: NotificationService) { }

    ngOnInit() {
        this.availableCsvFields = Object.values(this.corpus.fields).filter(field => field.downloadable);
    }

    /**
     * called by download csv button. Large files are rendered in backend via Celery async task and an email is send with download link from backend
     */
    public choose_download_method() {
        if (this.resultsCount < 1000) {
            this.isDownloading = true;
            this.downloadService.download(this.corpus, this.queryModel, this.getCsvFields(), this.resultsCount).then( results => {
                this.isDownloading = false;
                if (results['success']===false) {
                    this.notificationService.showMessage(results.message);
                }
            });
        }
        else {
            this.downloadService.downloadTask(this.corpus, this.queryModel, this.getCsvFields()).then( results => {
                if (results.success===false) {
                    this.notificationService.showMessage(results.message);
                }
                else {
                    this.notificationService.showMessage("Downloading CSV file... A link will be sent to your email address shortly.", 'success');
                }
            });
        }
    }

    // infbaia
    
    /**
     * modal pops up after connecting to backend api to start creating csv
     */
    toggleModal() {
        this.isModalActive = !this.isModalActive;
    }

    /**
     * modal pops up after connecting to backend api and there was an error
     */
    toggleModalError() {
        this.isModalActiveError = !this.isModalActiveError;
    }

    private selectCsvFieldsEvent(selection: CorpusField[]) {
        this.selectedCsvFields = selection;
    }

    private getCsvFields(): CorpusField[] {
        if (this.selectedCsvFields === undefined) {
            return this.corpus.fields.filter(field => field.csvCore);
        }
        else return this.selectedCsvFields;
    }


}
