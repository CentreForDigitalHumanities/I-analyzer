import {
    Component,
    Input,
    OnChanges,
    OnDestroy,
    SimpleChanges,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CorpusDefinitionService } from '../../corpus-definition.service';
import { CorpusDefinition } from '../../../models/corpus-definition';
import { ISO6393Languages } from '../constants';

@Component({
    selector: 'ia-meta-form',
    templateUrl: './meta-form.component.html',
    styleUrl: './meta-form.component.scss',
})
export class MetaFormComponent implements OnChanges, OnDestroy {
    @Input() corpus: CorpusDefinition;

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

    constructor(
        private formBuilder: FormBuilder,
        private corpusDefService: CorpusDefinitionService
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
}
