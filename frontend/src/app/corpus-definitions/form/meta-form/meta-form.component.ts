import {
    Component,
    Input,
    OnChanges,
    OnDestroy, SimpleChanges
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Subject, take, takeUntil, map, Observable } from 'rxjs';
import { CorpusDefinitionService } from '../../corpus-definition.service';
import { CorpusDefinition } from '../../../models/corpus-definition';
import { ISO6393Languages } from '../constants';
import { actionIcons, formIcons } from '@shared/icons';

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

    destroy$ = new Subject<void>();

    languageOptions = ISO6393Languages;
    actionIcons = actionIcons;
    formIcons = formIcons;

    nextStepDisabled$: Observable<boolean> = this.corpusDefService.steps$.pipe(
        map(steps => steps[1].disabled)
    );

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
        const newMeta = this.metaForm.value;
        this.corpus.definition.meta =
            newMeta as CorpusDefinition['definition']['meta'];
        this.corpus.save().subscribe({
            next: (value) => {
                this.metaForm.patchValue(value.definition.meta);
            },
            error: console.error,
        });
    }

    nextStep() {
        this.corpusDefService.activateStep(1);
    }
}
