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
import { PageResults, PageResultsParameters } from '../models/page-results';

const QUERY_IN_CONTEXT_FIELD = {
    name: 'context',
    description: `Query surrounded by 200 characters`,
    displayName: 'Query in context',
    displayType: 'text_content',
    csvCore: false,
    hidden: false,
    sortable: false,
    searchable: false,
    downloadable: true,
    filterOptions: null,
    mappingType: null,
} as unknown as CorpusField;


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

    resultsConfig: PageResults;

    actionIcons = actionIcons;

    downloadLimit: number;

    canDownloadDirectly$: Observable<boolean>;

    encodingOptions = ['utf-8', 'utf-16'];
    encoding: 'utf-8' | 'utf-16' = 'utf-8';

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

    ngOnChanges(changes: SimpleChanges) {
        if (changes.corpus) {
            this.availableCsvFields = _.filter(this.corpus?.fields, 'downloadable');
            this.selectedCsvFields = _.filter(this.corpus?.fields, 'csvCore');
        }
        if (changes.queryModel) {
            this.totalResults?.complete();
            this.resultsConfig?.complete();
            this.totalResults = new TotalResults(
                new SimpleStore(), this.searchService, this.queryModel
            );
            this.downloadDisabled$ = this.totalResults.result$.pipe(
                map(result => result > 0)
            );
            this.canDownloadDirectly$ = this.totalResults.result$.pipe(
                map(result => result <= this.directDownloadLimit)
            );
            this.resultsConfig = new PageResults(
                new SimpleStore(), this.searchService, this.queryModel
            );
        }
    }

    onHighlightChange(event): void {
        if (event.target.checked) {
            this.resultsConfig.setParams({ highlight: 200 });
        } else {
            this.resultsConfig.setParams({ highlight: null });
        }
    }

    /** download short file directly */
    public confirmDirectDownload() {
        const sort = this.resultsConfig.state$.value.sort;
        const highlight = this.resultsConfig.state$.value.highlight;
        this.isDownloading = true;
        this.downloadService
            .download(
                this.corpus,
                this.queryModel,
                this.getCsvFields(),
                this.directDownloadLimit,
                this.resultsRoute(this.queryModel, sort, highlight),
                sort,
                highlight,
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


    /** start backend task to create csv file */
    longDownload() {
        const sort = this.resultsConfig.state$.value.sort;
        const highlight = this.resultsConfig.state$.value.highlight;
        this.downloadService
            .downloadTask(
                this.corpus,
                this.queryModel,
                this.getCsvFields(),
                this.resultsRoute(this.queryModel, sort, highlight),
                sort,
                highlight,
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
        let selected: CorpusField[];
        if (this.selectedCsvFields === undefined) {
            selected = this.corpus.fields.filter((field) => field.csvCore);
        } else {
            selected = this.selectedCsvFields;
        }
        if (this.resultsConfig.state$.value.highlight) {
            selected.push(QUERY_IN_CONTEXT_FIELD);
        }
        return selected;
    }

    /**
     * Generate URL to view these results in the web interface
     */
    private resultsRoute(
        queryModel: QueryModel, sort: SortState, highlight?: number
    ): string {
        const resultsParameters: PageResultsParameters = {sort, from: 0, size: 20, highlight };
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
