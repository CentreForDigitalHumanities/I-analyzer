import { Component, Input, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
    APICorpusDefinitionField,
    CorpusDefinition,
} from '@models/corpus-definition';
import { CorpusDefinitionService } from 'app/corpus-definitions/corpus-definition.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'ia-field-form',
    templateUrl: './field-form.component.html',
    styleUrl: './field-form.component.scss',
})
export class FieldFormComponent {
    @Input() corpus: CorpusDefinition;
    destroy$ = new Subject<void>();
    fieldForm = this.formBuilder.group({
        display_name: [''],
        description: [''],
        type: [''],
        options: this.formBuilder.group({
            search: [''],
            filter: [''],
            preview: [''],
            visualize: [''],
            sort: [''],
            hidden: [false],
        }),
        language: [''],
    });

    constructor(
        private formBuilder: FormBuilder,
        private corpusDefService: CorpusDefinitionService
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.corpus) {
            this.corpus.definitionUpdated$
                .pipe(takeUntil(this.destroy$))
                .subscribe(() =>
                    this.fieldForm.patchValue(this.corpus.definition.meta)
                );
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
