import { Component } from '@angular/core';
import { actionIcons, formIcons } from '../../shared/icons';
import { ApiService } from '../../services';
import { CorpusDefinition } from '../../models/corpus-definition';

@Component({
    selector: 'ia-create-definition',
    templateUrl: './create-definition.component.html',
    styleUrls: ['./create-definition.component.scss']
})
export class CreateDefinitionComponent {
    actionIcons = actionIcons;
    formIcons = formIcons;

    corpus: CorpusDefinition;

    constructor(private apiService: ApiService) {
        this.corpus = new CorpusDefinition(apiService);
    }

    onJSONUpload(data: any) {
        this.corpus.setFromDefinition(data);
    }

    submit() {
        this.corpus.save();
    }

}
