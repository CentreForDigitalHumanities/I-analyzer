import { Component, DestroyRef, OnInit } from '@angular/core';
import { CorpusDefinitionService } from 'app/corpus-definitions/corpus-definition.service';
import * as _ from 'lodash';
import { EditablePage, makePages, PAGE_CATEGORIES } from './editable-page';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';


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
            data => this.pages.forEach(page => page.update(data))
        );
    }

    submit() {
        const updates = this.pages.map(page =>
            this.corpusDefService.saveDocumentationPage(
                page.id, page.content, page.title, page.corpusName,
            )
        );
        const all = forkJoin(updates).subscribe();
    }
}
