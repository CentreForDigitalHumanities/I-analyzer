import { Component } from '@angular/core';
import { CorpusDefinitionService } from 'app/corpus-definitions/corpus-definition.service';

@Component({
    selector: 'ia-documentation-form',
    templateUrl: './documentation-form.component.html',
    styleUrl: './documentation-form.component.scss'
})
export class DocumentationFormComponent {
    documentation$ = this.corpusDefService.documentation$;

    constructor(
        private corpusDefService: CorpusDefinitionService,
    ) {}

}
