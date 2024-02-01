import { Component, Input, OnChanges } from '@angular/core';

import { DownloadService, NotificationService } from '../services/index';
import { Corpus, CorpusField, DownloadOptions, PendingDownload, QueryModel } from '../models/index';
import { actionIcons } from '../shared/icons';

const highlightFragmentSize = 50;

@Component({
    selector: 'ia-download',
    templateUrl: './download.component.html',
    styleUrls: ['./download.component.scss'],
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
    public isModalActive = false;
    public isModalActiveError = false;

    public pendingDownload: PendingDownload;

    actionIcons = actionIcons;

    private resultsCutoff = 1000;

    private downloadsPageLink = {
        text: 'view downloads',
        route: ['/download-history'],
    };

    constructor(
        private downloadService: DownloadService,
        private notificationService: NotificationService
    ) {}

    ngOnChanges() {
        this.availableCsvFields = Object.values(this.corpus.fields).filter(
            (field) => field.downloadable
        );
        const highlight = this.queryModel?.highlightSize;
        // 'Query in context' becomes an extra option if any field in the corpus has been marked as highlightable
        if (highlight !== undefined) {
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
                filterOptions: null,
                mappingType: null,
            } as unknown as CorpusField);
        }
    }

    /**
     * called by download csv button. Large files are rendered in backend via Celery async task,
     * and an email is sent with download link from backend
     */
    public chooseDownloadMethod() {
        if (this.resultsCount < this.resultsCutoff) {
            this.directDownload();
        } else {
            this.longDownload();
        }
    }

    /** download short file directly */
    public confirmDirectDownload(options: DownloadOptions) {
        this.isDownloading = true;
        this.downloadService
            .download(
                this.corpus,
                this.queryModel,
                this.getCsvFields(),
                this.resultsCount,
                this.route,
                highlightFragmentSize,
                options
            )
            .catch((error) => {
                this.notificationService.showMessage(error);
            })
            .then(() => {
                this.isDownloading = false;
                this.pendingDownload = undefined;
            });
    }

    public selectCsvFields(selection: CorpusField[]) {
        this.selectedCsvFields = selection;
    }

    /** results can be downloaded directly: show menu to pick file options */
    private directDownload() {
        this.pendingDownload = { download_type: 'search_results' };
    }

    /** start backend task to create csv file */
    private longDownload() {
        this.downloadService
            .downloadTask(
                this.corpus,
                this.queryModel,
                this.getCsvFields(),
                this.route,
                highlightFragmentSize
            )
            .then((results) => {
                this.notificationService.showMessage(
                    'Downloading CSV file... A link will be sent to your email address shortly.',
                    'success',
                    this.downloadsPageLink
                );
            })
            .catch((error) => {
                this.notificationService.showMessage(error, 'danger');
            });
    }

    private getCsvFields(): CorpusField[] {
        if (this.selectedCsvFields === undefined) {
            return this.corpus.fields.filter((field) => field.csvCore);
        } else {
            return this.selectedCsvFields;
        }
    }
}
