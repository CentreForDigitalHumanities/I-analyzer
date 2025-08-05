import {
    Component,
    Input,
    OnChanges,
    OnDestroy, SimpleChanges
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { map, Observable, Subject, takeUntil, take } from 'rxjs';
import { CorpusDefinitionService } from '../../corpus-definition.service';
import { APIEditableCorpus, CorpusDefinition } from '../../../models/corpus-definition';
import { collectLanguages } from '../constants';
import { actionIcons, formIcons } from '@shared/icons';
import { mergeAsBooleans } from '@utils/observables';
import { MenuItem } from 'primeng/api';

@Component({
    selector: 'ia-meta-form',
    templateUrl: './meta-form.component.html',
    styleUrl: './meta-form.component.scss',
    standalone: false
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

    languageOptions = collectLanguages();
    actionIcons = actionIcons;
    formIcons = formIcons;

    nextStep$: Observable<MenuItem> = this.corpusDefService.steps$.pipe(
        map(steps => steps[1]),
    );

    changesSubmitted$ = new Subject<void>();
    changesSavedSucces$ = new Subject<void>();
    changesSavedError$ = new Subject<void>();

    loading$: Observable<boolean> = mergeAsBooleans({
        true: [this.changesSubmitted$],
        false: [this.changesSavedSucces$, this.changesSavedError$],
    });
    showSuccessMessage$: Observable<boolean> = mergeAsBooleans({
        true: [this.changesSavedSucces$],
        false: [this.metaForm.valueChanges, this.changesSubmitted$],
    });

    showErrorMessage$: Observable<boolean> = mergeAsBooleans({
        true: [this.changesSavedError$],
        false: [this.metaForm.valueChanges, this.changesSubmitted$]
    });

    constructor(
        private formBuilder: FormBuilder,
        private corpusDefService: CorpusDefinitionService,
    ) {
        console.log(this.languageOptions);
    }

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

    goToNextStep() {
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
