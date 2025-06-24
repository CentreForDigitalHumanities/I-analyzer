import { Component, OnDestroy, OnInit } from '@angular/core';
import { CorpusDataFile, DataFileInfo } from '@models/corpus-definition';
import { ApiService } from '@services';
import { actionIcons, formIcons } from '@shared/icons';
import { CorpusDefinitionService } from 'app/corpus-definitions/corpus-definition.service';
import * as _ from 'lodash';
import { MenuItem } from 'primeng/api';
import {
    BehaviorSubject,
    distinctUntilChanged,
    filter,
    map,
    Observable,
    of,
    Subject,
    switchMap,
    takeUntil,
} from 'rxjs';

@Component({
    selector: 'ia-data-form',
    templateUrl: './data-form.component.html',
    styleUrl: './data-form.component.scss',
})
export class DataFormComponent implements OnInit, OnDestroy {
    actionIcons = actionIcons;
    formIcons = formIcons;

    file$ = new BehaviorSubject<File | undefined>(undefined);
    dataFile: CorpusDataFile;
    fileInfo$ = new Subject<DataFileInfo>();
    error$ = new BehaviorSubject<Error | undefined>(undefined);
    destroy$ = new Subject<void>();

    nextStep$: Observable<MenuItem> = this.corpusDefService.steps$.pipe(
        map((steps) => steps[1])
    );

    constructor(
        private apiService: ApiService,
        private corpusDefService: CorpusDefinitionService
    ) {}

    ngOnInit() {
        this.apiService
            .listDataFiles(this.corpusDefService.corpus$.value.id, true)
            .pipe(
                map(_.head),
                filter(_.negate(_.isUndefined)),
                switchMap((dataFile) => this.loadDataFileInfo(dataFile)),
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: (info) => this.fileInfo$.next(info),
                error: (err) => this.error$.next(err),
            });

        this.fileInfo$
            .pipe(
                takeUntil(this.destroy$),
                distinctUntilChanged(_.isEqual),
                filter(_.negate(_.isUndefined)),
                switchMap((info) => {
                    const fields = _.map(info.fields, (dtype, colName) =>
                        this.corpusDefService.makeDefaultField(dtype, colName)
                    );
                    return of(fields);
                })
            )
            .subscribe({
                next: (fields) => this.corpusDefService.setFields(fields),
                error: console.error,
            });
    }

    onUpload(event: InputEvent) {
        const files: File[] = event.target['files'];
        const file = files ? _.first(files) : undefined;
        this.file$.next(file);
        const corpusId = this.corpusDefService.corpus$.value.id;
        this.apiService
            .createDataFile(corpusId, file)
            .pipe(
                takeUntil(this.destroy$),
                switchMap((dataFile) => this.loadDataFileInfo(dataFile))
            )
            .subscribe({
                next: (info) => this.fileInfo$.next(info),
                error: (err) => this.error$.next(err),
            });
    }

    replaceFile(event: InputEvent) {
        const files: File[] = event.target['files'];
        const file = files ? _.first(files) : undefined;
        console.log('replace file', file);
        // should show the upload dialog again
    }

    resetFile() {
        // delete the file
        this.apiService.deleteDataFile(this.dataFile).subscribe({
            next: () => {
                this.corpusDefService.setFields([]);
                this.fileInfo$.next(undefined);
                this.dataFile = undefined;
            },
            error: console.error,
        });
    }

    confirmFile() {
        this.apiService
            .patchDataFile(this.dataFile.id, { confirmed: true })
            .pipe(switchMap((datafile) => this.loadDataFileInfo(datafile)))
            .subscribe({
                next: (info) => this.fileInfo$.next(info),
                error: (err) => this.error$.next(err),
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    fileUploaded(): boolean {
        return !!this.dataFile && !_.isEmpty(this.dataFile.file);
    }

    fileConfirmed(): boolean {
        return this.fileUploaded() && !!this.dataFile?.confirmed;
    }

    private loadDataFileInfo(dataFile: CorpusDataFile) {
        this.dataFile = dataFile;
        return this.apiService.getDataFileInfo(dataFile);
    }
}
