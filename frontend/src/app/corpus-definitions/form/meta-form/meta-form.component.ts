import {
    Component,
    Input,
    OnChanges,
    OnDestroy,
    SimpleChanges,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { BehaviorSubject, Observable, Subject, switchMap, takeUntil } from 'rxjs';
import { CorpusDefinitionService } from '../../corpus-definition.service';
import { CorpusDefinition } from '../../../models/corpus-definition';
import { ISO6393Languages } from '../constants';
import { actionIcons } from '@shared/icons';
import * as _ from 'lodash';
import { ApiService } from '@services';

@Component({
    selector: 'ia-meta-form',
    templateUrl: './meta-form.component.html',
    styleUrl: './meta-form.component.scss',
})
export class MetaFormComponent implements OnChanges, OnDestroy {
    @Input({required: true}) corpus!: CorpusDefinition;

    categories = [
        { value: 'parliament', label: 'Parliamentary debates' },
        { value: 'periodical', label: 'Newspapers and other periodicals' },
        { value: 'finance', label: 'Financial reports' },
        { value: 'ruling', label: 'Court rulings' },
        { value: 'review', label: 'Online reviews' },
        { value: 'inscription', label: 'Funerary inscriptions' },
        { value: 'oration', label: 'Orations' },
        { value: 'book', label: 'Books' },
        { value: 'informative', label: 'Informative' },
        { value: undefined, label: 'Other' },
    ];

    metaForm = this.formBuilder.group({
        title: [''],
        description: [''],
        category: [''],
        date_range: this.formBuilder.group({
            min: [''],
            max: [''],
        }),
        languages: [['']],
    });

    file$ = new BehaviorSubject<File | undefined>(undefined);
    destroy$ = new Subject<void>();

    languageOptions = ISO6393Languages;
    actionIcons = actionIcons;

    constructor(
        private formBuilder: FormBuilder,
        private corpusDefService: CorpusDefinitionService,
        private apiService: ApiService,
    ) {}

    get currentCategoryLabel(): string {
        const value = this.metaForm.controls.category.value;
        const item = this.categories.find(item => item.value == value);
        return item?.label;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.corpus) {
            this.corpus.definitionUpdated$
                .pipe(takeUntil(this.destroy$))
                .subscribe(() =>
                    this.metaForm.patchValue(this.corpus.definition.meta)
                );
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onSubmit(): void {
        const newMeta = this.metaForm.value;
        this.corpus.definition.meta =
            newMeta as CorpusDefinition['definition']['meta'];
        this.corpus.save().subscribe({
            next: () => {
                this.corpusDefService.toggleStepDisabled(1);
                this.corpusDefService.activateStep(1);
            },
            error: console.error,
        });
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
            .subscribe();
    }

    deleteImage() {
        const corpusName = this.corpusDefService.corpus$.value.definition.name;
        this.apiService.deleteCorpusImage(corpusName).pipe(
            takeUntil(this.destroy$),
        ).subscribe();
    }
}
