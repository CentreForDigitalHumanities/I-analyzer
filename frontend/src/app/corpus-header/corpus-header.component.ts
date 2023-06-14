import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { faDiagramProject, faInfo, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { Corpus } from '../models';

@Component({
    selector: 'ia-corpus-header',
    templateUrl: './corpus-header.component.html',
    styleUrls: ['./corpus-header.component.scss']
})
export class CorpusHeaderComponent implements OnChanges, OnInit {
    @Input() corpus: Corpus;
    @Input() currentPage: 'search'|'word-models'|'document'|'info';

    searchIcon = faMagnifyingGlass;
    wordModelsIcon = faDiagramProject;
    infoIcon = faInfo;

    wordModelsPresent: boolean;

    constructor() {
    }

    ngOnInit() {
        window.scrollTo(0,0);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.corpus) {
            this.wordModelsPresent = this.corpus.word_models_present;
        }
    }
}
