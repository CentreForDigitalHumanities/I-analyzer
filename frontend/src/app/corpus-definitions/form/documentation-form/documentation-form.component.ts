import { Component, DestroyRef, OnInit } from '@angular/core';
import { CorpusDefinitionService } from 'app/corpus-definitions/corpus-definition.service';
import * as _ from 'lodash';
import { EditablePage, makePages, PAGE_CATEGORIES } from './editable-page';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
    selector: 'ia-documentation-form',
    templateUrl: './documentation-form.component.html',
    styleUrl: './documentation-form.component.scss'
})
export class DocumentationFormComponent implements OnInit {
    documentation$ = this.corpusDefService.documentation$;

    categories = PAGE_CATEGORIES;

    pages: EditablePage[] = makePages(
        this.corpusDefService.corpus$.value.definition.name
    );

    constructor(
        private corpusDefService: CorpusDefinitionService,
        private destroyRef: DestroyRef,
    ) {}

    ngOnInit(): void {
        this.documentation$.pipe(
            takeUntilDestroyed(this.destroyRef),
        ).subscribe(
            data => this.pages.forEach(page =>
                this.corpusDefService.updateDocumentationPage(page, data)
            )
        );
    }

    submit() {
        this.corpusDefService.saveDocumentationPages(this.pages).subscribe();
    }
}
