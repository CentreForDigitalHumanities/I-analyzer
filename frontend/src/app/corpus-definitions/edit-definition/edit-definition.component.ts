import { Component, } from '@angular/core';
import { actionIcons, formIcons } from '../../shared/icons';
import { Subject } from 'rxjs';
import { CorpusDefinition } from '../../models/corpus-definition';
import { ApiService } from '../../services';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'ia-edit-definition',
    templateUrl: './edit-definition.component.html',
    styleUrls: ['./edit-definition.component.scss'],
})
export class EditDefinitionComponent {
    actionIcons = actionIcons;
    formIcons = formIcons;

    reset$: Subject<void> = new Subject();

    corpus: CorpusDefinition;

    constructor(
        private apiService: ApiService,
        private route: ActivatedRoute,

    ) {
        const id = parseInt(this.route.snapshot.params['corpusID'], 10);
        this.corpus = new CorpusDefinition(this.apiService, id);
    }

    downloadJSON() {
        const data = this.corpus.toDefinition();
        const content = JSON.stringify(data, undefined, 4);
        const blob = new Blob([content], { type: `application/json;charset=utf-8`, endings: 'native' });
        const filename = data.name + '.json';
        saveAs(blob, filename);
    }

    onJSONUpload(data: any) {
        this.corpus.setFromDefinition(data);
    }

    submit() {
        this.corpus.save();
    }

    reset() {
        this.reset$.next();
    }
}
