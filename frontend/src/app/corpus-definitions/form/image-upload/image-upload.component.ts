import { Component, Input, SimpleChanges } from '@angular/core';
import { CorpusDefinition } from '@models/corpus-definition';
import { ApiService } from '@services';
import { actionIcons } from '@shared/icons';
import { CorpusDefinitionService } from 'app/corpus-definitions/corpus-definition.service';
import * as _ from 'lodash';
import { BehaviorSubject, map, Observable, Subject, takeUntil, timestamp } from 'rxjs';

@Component({
  selector: 'ia-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.scss'
})
export class ImageUploadComponent {
    @Input({required: true}) corpus!: CorpusDefinition;

    file$ = new BehaviorSubject<File | undefined>(undefined);
    destroy$ = new Subject<void>();

    actionIcons = actionIcons;

    imageUpdated$ = new Subject<void>();
    imageURL$: Observable<string>;

    constructor(
        private corpusDefService: CorpusDefinitionService,
        private apiService: ApiService,
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.corpus) {
            this.imageURL$ = this.corpus.definitionUpdated$.pipe(
                map(() => this.corpus.definition.name),
                map(name => `/api/corpus/image/${name}`),
                timestamp(),
                map(({value, timestamp}) => `${value}?t=${timestamp}`)
            );
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }


    onImageUpload(event: InputEvent) {
        const files: File[] = event.target['files'];
        const file = files ? _.first(files) : undefined;
        this.file$.next(file);
        const corpusName = this.corpusDefService.corpus$.value.definition.name;
        this.apiService
            .updateCorpusImage(corpusName, file)
            .pipe(
                takeUntil(this.destroy$),
            )
            .subscribe({
                next: () => this.onImageUpdate(),
            });
    }

    deleteImage() {
        const corpusName = this.corpusDefService.corpus$.value.definition.name;
        this.apiService.deleteCorpusImage(corpusName).pipe(
            takeUntil(this.destroy$),
        ).subscribe({
            next: () => this.onImageUpdate(),
        });
    }

    onImageUpdate() {
        this.corpus.save();
    }

}
