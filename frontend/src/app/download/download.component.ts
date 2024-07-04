import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as _ from 'lodash';

import { environment } from '../../environments/environment';
import { AuthService, DownloadService, NotificationService, SearchService } from '../services/index';
import { Corpus, CorpusField, PendingDownload, QueryModel, SortState } from '../models/index';
import { actionIcons } from '../shared/icons';
import { TotalResults } from '../models/total-results';
import { SimpleStore } from '../store/simple-store';
import { Observable, map } from 'rxjs';
import { Router } from '@angular/router';
import { pageResultsParametersToParams } from '../utils/params';
import { PageResultsParameters } from '../models/page-results';

@Component({
    selector: 'ia-download',
    templateUrl: './download.component.html',
    styleUrls: ['./download.component.scss'],
})
export class DownloadComponent implements OnChanges {
    @Input() public corpus: Corpus;
    @Input() public queryModel: QueryModel;

    public selectedCsvFields: CorpusField[];
    public availableCsvFields: CorpusField[];

    public isDownloading: boolean;
    public isModalActive = false;
    public isModalActiveError = false;

    public pendingDownload: PendingDownload;

    actionIcons = actionIcons;

    downloadLimit: number;

    canDownloadDirectly$: Observable<boolean>;

    encodingOptions = ['utf-8', 'utf-16'];
    encoding: 'utf-8' | 'utf-16' = 'utf-8';

    sort: SortState = [undefined, 'asc'];
    highlight = false;

    totalResults: TotalResults;
    downloadDisabled$: Observable<boolean>;

    private directDownloadLimit: number = environment.directDownloadLimit;
    private userDownloadLimit: number;

    private downloadsPageLink = {
        text: 'view downloads',
        route: ['/download-history'],
    };

    constructor(
        private downloadService: DownloadService,
        private notificationService: NotificationService,
        private searchService: SearchService,
        private authService: AuthService,
        private router: Router,
    ) {
        this.userDownloadLimit = this.authService.getCurrentUser().downloadLimit;
        this.downloadLimit = this.userDownloadLimit || this.directDownloadLimit;
    }

    private get highlightSize(): number|undefined {
        return this.highlight ? 200  : undefined;
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.queryModel) {
            this.totalResults?.complete();
            this.totalResults = new TotalResults(
                new SimpleStore(), this.searchService, this.queryModel
            );
            this.downloadDisabled$ = this.totalResults.result$.pipe(
                map(result => result > 0)
            );
            this.canDownloadDirectly$ = this.totalResults.result$.pipe(
                map(result => result <= this.directDownloadLimit)
            );
        }

        this.availableCsvFields = _.filter(this.corpus?.fields, 'downloadable');
        const highlight = undefined;
        // 'Query in context' becomes an extra option if any field in the corpus has been marked as highlightable
        if (highlight !== undefined) {
            this.availableCsvFields.push({
                name: 'context',
                description: `Query surrounded by ${highlight} characters`,
                displayName: 'Query in context',
                displayType: 'text_content',
                csvCore: false,
                hidden: false,
                sortable: false,
                searchable: false,
                downloadable: true,
                filterOptions: null,
                mappingType: null,
            } as unknown as CorpusField);
        }
    }


    /** download short file directly */
    public confirmDirectDownload() {
        this.isDownloading = true;
        this.downloadService
            .download(
                this.corpus,
                this.queryModel,
                this.getCsvFields(),
                this.directDownloadLimit,
                this.resultsRoute(this.queryModel, this.sort, this.highlightSize),
                this.sort,
                this.highlightSize,
                { encoding: this.encoding }
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

    /** start backend task to create csv file */
    longDownload() {
        this.downloadService
            .downloadTask(
                this.corpus,
                this.queryModel,
                this.getCsvFields(),
                this.resultsRoute(this.queryModel, this.sort, this.highlightSize),
                this.sort,
                this.highlightSize,
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

    /**
     * Generate URL to view these results in the web interface
     */
    private resultsRoute(
        queryModel: QueryModel, sort: SortState, highlight?: number
    ): string {
        const resultsParameters: PageResultsParameters = {sort, from: 0, size: 20 };
        const queryParams = {
            ...queryModel.toQueryParams(),
            ...pageResultsParametersToParams(resultsParameters, queryModel.corpus)
        };
        const tree = this.router.createUrlTree(
            ['/search', queryModel.corpus.name],
            { queryParams }
        );
        return tree.toString();
    }
}
