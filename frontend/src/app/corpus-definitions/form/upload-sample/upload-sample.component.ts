import { Component, OnDestroy, OnInit } from '@angular/core';
import { CorpusDataFile } from '@models/corpus-definition';
import { ApiService } from '@services';
import { actionIcons, formIcons } from '@shared/icons';
import { CorpusDefinitionService } from 'app/corpus-definitions/corpus-definition.service';
import * as _ from 'lodash';
import {
    BehaviorSubject,
    filter,
    map,
    Subject,
    takeUntil,
    withLatestFrom,
} from 'rxjs';

@Component({
    selector: 'ia-upload-sample',
    templateUrl: './upload-sample.component.html',
    styleUrl: './upload-sample.component.scss',
})
export class UploadSampleComponent implements OnInit, OnDestroy {
    actionIcons = actionIcons;
    formIcons = formIcons;

    newFile$ = new BehaviorSubject<File | undefined>(undefined);
    dataFile$ = new BehaviorSubject<CorpusDataFile | undefined>(undefined);
    error$ = new BehaviorSubject<Error | undefined>(undefined);
    destroy$ = new Subject<void>();
    submit$ = new Subject<void>();

    delimiterOptions = [
        { label: ', comma', value: ',' },
        { label: '; semicolon', value: ';' },
        { label: 'tab', value: '\t' },
    ];

    constructor(
        private apiService: ApiService,
        private corpusDefService: CorpusDefinitionService
    ) {}

    ngOnInit() {
        this.apiService
            .listDataFiles(this.corpusDefService.corpus$.value.id, true)
            .pipe(map(_.head), filter(_.negate(_.isUndefined)))
            .subscribe({
                next: (df: CorpusDataFile) => {
                    this.dataFile$.next(df);
                },
                error: (err) => this.error$.next(err),
            });

        this.submit$
            .pipe(takeUntil(this.destroy$), withLatestFrom(this.dataFile$))
            .subscribe({
                next: ([_submit, dataFile]) => {
                    const fields = _.map(
                        dataFile.field_types,
                        (dtype, colName) =>
                            this.corpusDefService.makeDefaultField(
                                dtype,
                                colName
                            )
                    );
                    this.corpusDefService.setFields(fields);
                },
                error: console.error,
            });
    }

    onDelimiterChange(event: InputEvent) {
        this.corpusDefService.setDelimiter(event.target['value']);
    }

    onUpload(event: InputEvent) {
        const files: File[] = event.target['files'];
        const file = files ? _.first(files) : undefined;
        this.newFile$.next(file);
        const corpusId = this.corpusDefService.corpus$.value.id;
        this.apiService
            .createDataFile(corpusId, file)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (df) => {
                    this.dataFile$.next(df);
                },
                error: (err) => this.error$.next(err),
            });
    }

    onSubmit() {
        this.submit$.next();
    }

    resetFields() {
        this.apiService.deleteDataFile(this.dataFile$.value).subscribe({
            next: () => {
                this.dataFile$.next(undefined);
            },
            error: console.error,
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.submit$.complete();
    }
}
