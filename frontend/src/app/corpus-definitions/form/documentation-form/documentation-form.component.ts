import { Component, DestroyRef, OnInit } from '@angular/core';
import { CorpusDefinitionService } from 'app/corpus-definitions/corpus-definition.service';
import * as _ from 'lodash';
import { PAGE_CATEGORIES } from './editable-page';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup } from '@angular/forms';
import { filter, map, switchMap } from 'rxjs';
import { APICorpusDefinition } from '@models/corpus-definition';


@Component({
    selector: 'ia-documentation-form',
    templateUrl: './documentation-form.component.html',
    styleUrl: './documentation-form.component.scss'
})
export class DocumentationFormComponent implements OnInit {
    form = new FormGroup({
        general: new FormControl<string>(''),
        citation: new FormControl<string>(''),
        license: new FormControl<string>(''),
    });

    categories = PAGE_CATEGORIES;

    constructor(
        private corpusDefService: CorpusDefinitionService,
        private destroyRef: DestroyRef,
    ) {}

    ngOnInit(): void {
        this.corpusDefService.corpus$.pipe(
            switchMap(corpus => corpus.definitionUpdated$),
            map(() => this.corpusDefService.corpus$.value.definition),
            filter(definition => !!definition),
            takeUntilDestroyed(this.destroyRef),
        ).subscribe({
            next: (value) => this.updateForm(value),
        });
    }

    updateForm(value: APICorpusDefinition) {
        this.form.setValue({
            general: value.documentation?.general || '',
            citation: value.documentation?.citation || '',
            license: value.documentation?.license || '',
        });
    }

    submit() {
        const corpus = this.corpusDefService.corpus$.value;
        const values = _.values(this.form.controls).map(control => control.value);
        if (_.every(values, _.isEmpty)) {
            corpus.definition = _.omit(corpus.definition, 'documentation');
        } else {
            corpus.definition.documentation = _.omitBy(this.form.value, _.isEmpty);
        }
        corpus.save();
    }
}
