import { Component } from '@angular/core';
import {
    APICorpusDefinition,
    CorpusDefinition,
    DataFileInfo,
} from '@models/corpus-definition';
import { ApiService } from '@services';
import { actionIcons } from '@shared/icons';
import { CorpusDefinitionService } from 'app/corpus-definitions/corpus-definition.service';
import * as _ from 'lodash';
import { BehaviorSubject, Subject, switchMap, takeUntil } from 'rxjs';

@Component({
    selector: 'ia-upload-sample',
    templateUrl: './upload-sample.component.html',
    styleUrl: './upload-sample.component.scss',
})
export class UploadSampleComponent {
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

    onDelimiterChange(event: InputEvent) {
        this.corpusDefService.setDelimiter(event.target['value']);
    }

    onUploadConfirm(event: InputEvent) {
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
                    this.corpusDefService.toggleStep(2);
                },
                error: (err) => this.error$.next(err),
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
