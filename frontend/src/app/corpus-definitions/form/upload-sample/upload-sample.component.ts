import { Component, OnDestroy, OnInit } from '@angular/core';
import {
    APICorpusDefinition,
    APICorpusDefinitionField,
    CorpusDefinition,
    DataFileInfo,
} from '@models/corpus-definition';
import { ApiService } from '@services';
import { actionIcons } from '@shared/icons';
import { CorpusDefinitionService } from 'app/corpus-definitions/corpus-definition.service';
import * as _ from 'lodash';
import { BehaviorSubject, from, of, Subject, switchMap, takeUntil } from 'rxjs';

@Component({
    selector: 'ia-upload-sample',
    templateUrl: './upload-sample.component.html',
    styleUrl: './upload-sample.component.scss',
})
export class UploadSampleComponent implements OnInit, OnDestroy {
    actionIcons = actionIcons;

    file$ = new BehaviorSubject<File | undefined>(undefined);
    fileInfo$ = new Subject<DataFileInfo>();
    error$ = new BehaviorSubject<Error | undefined>(undefined);
    destroy$ = new Subject<void>();

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
        this.fileInfo$
            .pipe(
                takeUntil(this.destroy$),
                switchMap((info: DataFileInfo) => {
                    const fields = _.map(info, (dtype, colName) =>
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

    onDelimiterChange(event: InputEvent) {
        this.corpusDefService.setDelimiter(event.target['value']);
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
                switchMap((dataFile) =>
                    this.apiService.getDataFileInfo(dataFile)
                )
            )
            .subscribe({
                next: (info) => {
                    this.fileInfo$.next(info);
                },
                error: (err) => this.error$.next(err),
            });
    }

    onSubmit() {
        this.corpusDefService.toggleStep(2);
        this.corpusDefService.activateStep(2);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
