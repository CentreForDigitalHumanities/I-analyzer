import {
    AfterViewInit,
    Component,
    OnDestroy,
    OnInit,
    ViewChild,
} from '@angular/core';
import { CorpusDataFile, DataFileInfo } from '@models/corpus-definition';
import { ApiService, DialogService } from '@services';
import { ConfirmModalComponent } from '@shared/confirm-modal/confirm-modal.component';
import { actionIcons, formIcons } from '@shared/icons';
import { CorpusDefinitionService } from 'app/corpus-definitions/corpus-definition.service';
import * as _ from 'lodash';
import { MenuItem } from 'primeng/api';
import {
    BehaviorSubject,
    combineLatest,
    concat,
    filter,
    map,
    Observable,
    Subject,
    switchMap,
    take,
    takeUntil
} from 'rxjs';

@Component({
    selector: 'ia-data-form',
    templateUrl: './data-form.component.html',
    styleUrl: './data-form.component.scss',
    standalone: false,
})
export class DataFormComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('confirmReplace') ReplaceConfirmModal: ConfirmModalComponent;

    actionIcons = actionIcons;
    formIcons = formIcons;

    filesChanged$ = new Subject<void>();

    dataFiles$ = new BehaviorSubject<CorpusDataFile[] | undefined>(undefined);
    unconfirmed$: Observable<CorpusDataFile>;
    confirmed$: Observable<CorpusDataFile>;

    error$ = new BehaviorSubject<Error | undefined>(undefined);
    destroy$ = new Subject<void>();

    nextStep$: Observable<MenuItem> = this.corpusDefService.steps$.pipe(
        map((steps) => steps[1])
    );

    // DIT NAAR STATES UIT INDEX FORM
    // no file uploaded
    noneUploaded$ = this.dataFiles$.pipe(map((files) => _.isEmpty(files)));

    // first file uploaded, not confirmed
    firstUploaded$ = this.dataFiles$.pipe(
        map((files) => {
            return files?.length === 1 && _.some(files, { confirmed: false });
        })
    );

    // first file uploaded and confirmed
    firstConfirmed$ = this.dataFiles$.pipe(
        map((files) => {
            return files?.length === 1 && _.some(files, { confirmed: true });
        })
    );

    // new file uploaded, not confirmed
    newUploaded$ = this.dataFiles$.pipe(
        map((files) => {
            return (
                files?.length === 2 &&
                _.some(files, { confirmed: true }) &&
                _.some(files, { confirmed: false })
            );
        })
    );

    constructor(
        private apiService: ApiService,
        private corpusDefService: CorpusDefinitionService,
        private dialogService: DialogService
    ) {}

    ngOnInit() {
        this.confirmed$ = this.dataFiles$.pipe(
            filter(_.negate(_.isUndefined)),
            map((files) => files.find((file) => file.confirmed))
        );

        this.unconfirmed$ = this.dataFiles$.pipe(
            filter(_.negate(_.isUndefined)),
            map((files) => files.find((file) => !file.confirmed))
        );

        this.filesChanged$.subscribe({
            next: () => this.refreshDataFiles(),
        });

        this.refreshDataFiles();
    }

    ngAfterViewInit() {
        // Watches the newUploaded boolean
        // If true, open the confirmation modal
        const uploaded$ = this.newUploaded$.pipe(filter((x) => x === true));

        combineLatest([uploaded$, this.unconfirmed$])
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: ([uploaded, unconfirmedFile]) =>
                    this.ReplaceConfirmModal.open(unconfirmedFile),
            });
    }

    onUpload(event: InputEvent) {
        const files: File[] = event.target['files'];
        const file = files ? _.first(files) : undefined;
        this.createDataFile(file);
    }

    handleReset = (): Observable<any> =>
        this.dataFiles$.pipe(
            switchMap((files) => {
                console.log(files);
                return files.map((file) => {
                    console.log(file);
                    return this.apiService.deleteDataFile(file);
                });
            })
        );

    onResetComplete() {
        // reset corpus fields
        this.corpusDefService.setFields([]);
        this.filesChanged$.next();
    }

    // Confirm file replacement
    // Removes the old file, then confirms the new
    handleReplace = () => {
        const removeConfirmed = this.confirmed$.pipe(
            switchMap((df) => this.apiService.deleteDataFile(df))
        );
        const confirmUnconfirmed = this.unconfirmed$.pipe(
            takeUntil(this.destroy$),
            switchMap((datafile) =>
                this.apiService.patchDataFile(datafile.id, {
                    confirmed: true,
                })
            )
        );
        return concat(removeConfirmed, confirmUnconfirmed);
    };

    onReplaceAccept() {
        this.refreshDataFiles();
    }

    onReplaceReject() {
        // Remove unconfirmed file
        console.log('reject');
    }

    confirmFile() {
        this.unconfirmed$
            .pipe(
                takeUntil(this.destroy$),
                switchMap((datafile) =>
                    this.apiService.patchDataFile(datafile.id, {
                        confirmed: true,
                    })
                )
            )
            .subscribe({
                next: (datafile) => {
                    this.setCorpusFields(datafile.csv_info);
                    this.filesChanged$.next();
                },
                error: (err) => this.error$.next(err),
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    openDocumentation() {
        this.dialogService.showManualPage('uploading-source-data');
    }

    private createDataFile(file: File): void {
        const corpusId = this.corpusDefService.corpus$.value.id;
        this.apiService
            .createDataFile(corpusId, file)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => this.filesChanged$.next(),
                error: (err) => this.error$.next(err),
            });
    }

    private refreshDataFiles(): void {
        this.apiService
            .listDataFiles(this.corpusDefService.corpus$.value.id, true)
            .pipe(filter(_.negate(_.isUndefined)), takeUntil(this.destroy$))
            .subscribe({
                next: (datafiles) => this.dataFiles$.next(datafiles),
                error: (err) => this.error$.next(err),
            });
    }

    private setCorpusFields(info: DataFileInfo) {
        const fields = _.map(info.fields, (field) =>
            this.corpusDefService.makeDefaultField(field.type, field.name)
        );
        this.nextStep();
        this.corpusDefService.setFields(fields);
    }

    private nextStep() {
        this.corpusDefService.corpus$.value.definitionUpdated$
            .pipe(take(1), takeUntil(this.destroy$))
            .subscribe(() => this.corpusDefService.activateStep(2));
    }
}
