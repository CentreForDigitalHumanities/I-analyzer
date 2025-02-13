import { Component } from '@angular/core';
import { CorpusDocumentationPage, CorpusDocumentationPageEditable } from '@models';
import { CorpusDefinitionService } from 'app/corpus-definitions/corpus-definition.service';
import * as _ from 'lodash';

const CATEGORIES = [
    {
        id: 'general',
        title: 'General Information',
    },
    {
        id: 'citation',
        title: 'Citation',
    },
    {
        id: 'license',
        title: 'License'
    },
    {
        id: 'terms_of_service',
        title: 'Terms of service',
    },
    {
        id: 'wordmodels',
        title: 'Word models'
    }
];


@Component({
    selector: 'ia-documentation-form',
    templateUrl: './documentation-form.component.html',
    styleUrl: './documentation-form.component.scss'
})
export class DocumentationFormComponent {
    documentation$ = this.corpusDefService.documentation$;

    categories = CATEGORIES;

    constructor(
        private corpusDefService: CorpusDefinitionService,
    ) {}


    pageByTitle(title: string, pages: CorpusDocumentationPage[]): CorpusDocumentationPageEditable {
        const existing = pages.find(page => page.type == title);
        return existing || this.newPage(title);
    }

    private newPage(title: string): CorpusDocumentationPageEditable {
        return {
            corpus: this.corpusDefService.corpus$.value.definition.name,
            content_template: '',
            type: title,
        }
    }

    submit() {
    }
}
