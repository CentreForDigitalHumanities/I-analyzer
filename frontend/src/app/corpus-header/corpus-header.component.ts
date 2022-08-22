import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { faDiagramProject, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { Corpus } from '../models';
import { DialogService } from '../services';

@Component({
    selector: 'ia-corpus-header',
    templateUrl: './corpus-header.component.html',
    styleUrls: ['./corpus-header.component.scss']
})
export class CorpusHeaderComponent implements OnChanges {
    @Input() corpus: Corpus;
    @Input() currentPage: 'search'|'word-models';

    searchIcon = faMagnifyingGlass;
    wordModelsIcon = faDiagramProject;

    wordModelsPresent: boolean;


    constructor(private dialogService: DialogService) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.corpus) {
            this.wordModelsPresent = this.corpus.word_models_present;
        }
    }

    public showCorpusInfo(corpus: Corpus) {
        this.dialogService.showDescriptionPage(corpus);
    }


}
