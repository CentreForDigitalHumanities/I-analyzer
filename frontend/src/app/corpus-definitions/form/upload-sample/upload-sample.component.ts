import { Component } from '@angular/core';
import { ApiService } from '@services';
import { actionIcons } from '@shared/icons';
import { CorpusDefinitionService } from 'app/corpus-definitions/corpus-definition.service';
import * as _ from 'lodash';
import { BehaviorSubject } from 'rxjs';

@Component({
    selector: 'ia-upload-sample',
    templateUrl: './upload-sample.component.html',
    styleUrl: './upload-sample.component.scss',
})
export class UploadSampleComponent {
    actionIcons = actionIcons;

    file$ = new BehaviorSubject<File | undefined>(undefined);

    constructor(
        private apiService: ApiService,
        private corpusDefService: CorpusDefinitionService
    ) {}

    onUploadConfirm(event: InputEvent) {
        const files: File[] = event.target['files'];
        const file = files ? _.first(files) : undefined;
        this.file$.next(file);
        const corpusId = this.corpusDefService.corpus$.value.id;
        this.apiService.createDataFile(corpusId, file).subscribe({
            next: console.log,
            error: console.error,
        });
    }
}
