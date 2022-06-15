import { Component, Input, OnChanges } from '@angular/core';

import { DownloadService, NotificationService } from '../services/index';
import { Corpus, CorpusField, QueryModel } from '../models/index';

const highlightFragmentSize = 50;

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
        const highlight = Object.values(this.corpus.fields).filter(field => field.searchable);
        // 'Query in context' becomes an extra option if any field in the corpus has been marked as highlightable
        if (highlight) {
            this.availableCsvFields.push({
                name: 'context',
                description: 'Query surrounded by 50 characters',
                displayName: 'Query in context',
                displayType: 'text_content',
                csvCore: true,
                hidden: false,
                sortable: false,
                primarySort: false,
                searchable: false,
                downloadable: true,
                searchFilter: null
            });
        }
    }

    /**
     * called by download csv button. Large files are rendered in backend via Celery async task,
     * and an email is sent with download link from backend
     */
    public chooseDownloadMethod() {
        if (this.resultsCount < this.resultsCutoff) {
            this.isDownloading = true;
            this.downloadService.download(
                this.corpus, this.queryModel, this.getCsvFields(), this.resultsCount, this.route, highlightFragmentSize
            ).then( results => {
                this.isDownloading = false;
            }).catch( error => {
                this.isDownloading = false;
                this.notificationService.showMessage(error);
            });
        } else {
            this.downloadService.downloadTask(
                this.corpus, this.queryModel, this.getCsvFields(), this.route, highlightFragmentSize
            ).then( results => {
                if (results.success === false) {
                    this.notificationService.showMessage(results.message);
                } else {
                    this.notificationService.showMessage(
                        'Downloading CSV file... A link will be sent to your email address shortly.', 'success'
                    );
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
        } else { return this.selectedCsvFields; }
    }


}
