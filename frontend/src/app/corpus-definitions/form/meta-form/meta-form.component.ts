import {
    Component,
    Input,
    OnChanges,
    OnDestroy, SimpleChanges
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Subject, take, takeUntil, map, Observable, merge } from 'rxjs';
import { CorpusDefinitionService } from '../../corpus-definition.service';
import { APIEditableCorpus, CorpusDefinition } from '../../../models/corpus-definition';
import { ISO6393Languages } from '../constants';
import { actionIcons, formIcons } from '@shared/icons';
import * as _ from 'lodash';

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
            min: [],
            max: [],
        }),
        languages: [['']],
    });

    destroy$ = new Subject<void>();

    languageOptions = ISO6393Languages;
    actionIcons = actionIcons;
    formIcons = formIcons;

    nextStepDisabled$: Observable<boolean> = this.corpusDefService.steps$.pipe(
        map(steps => steps[1].disabled)
    );

    changesSubmitted$ = new Subject<void>();
    changesSavedSucces$ = new Subject<void>();
    changesSavedError$ = new Subject<void>();

    loading$: Observable<boolean> = merge(
        this.changesSubmitted$.pipe(
            map(_.constant(true)),
        ),
        this.changesSavedSucces$.pipe(
            map(_.constant(false)),
        ),
        this.changesSavedError$.pipe(
            map(_.constant(false)),
        )
    );
    showSuccessMessage$: Observable<boolean> = merge(
        this.changesSavedSucces$.pipe(
            map(_.constant(true)),
        ),
        this.metaForm.valueChanges.pipe(
            map(_.constant(false)),
        ),
        this.changesSubmitted$.pipe(
            map(_.constant(false))
        ),
    );
    showErrorMessage$: Observable<boolean> = merge(
        this.changesSavedError$.pipe(
            map(_.constant(true)),
        ),
        this.metaForm.valueChanges.pipe(
            map(_.constant(false)),
        ),
        this.changesSubmitted$.pipe(
            map(_.constant(false))
        ),
    );;

    constructor(
        private formBuilder: FormBuilder,
        private corpusDefService: CorpusDefinitionService,
    ) {}

    get currentCategoryLabel(): string {
        const value = this.metaForm.controls.category.value;
        const item = this.categories.find(item => item.value == value);
        return item?.label;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.corpus) {
            this.corpus.definitionUpdated$
                .pipe(
                    take(1),
                    takeUntil(this.destroy$)
                )
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
        this.changesSubmitted$.next();
        const newMeta = this.metaForm.value;
        this.corpus.definition.meta =
            newMeta as CorpusDefinition['definition']['meta'];
        this.corpus.save().subscribe({
            next: this.onSubmitSuccess.bind(this),
            error: this.onSubmitError.bind(this),
        });
    }

    nextStep() {
        this.corpusDefService.activateStep(1);
    }

    private onSubmitSuccess(value: APIEditableCorpus) {
        this.metaForm.patchValue(value.definition.meta);
        this.changesSavedSucces$.next();
    }

    private onSubmitError(err) {
        this.changesSavedError$.next();
        console.error(err);
    }
}
