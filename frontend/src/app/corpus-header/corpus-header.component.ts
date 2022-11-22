import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { faDiagramProject, faInfoCircle, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { Corpus } from '../models';
import { DialogService } from '../services';

@Component({
    selector: 'ia-corpus-header',
    templateUrl: './corpus-header.component.html',
    styleUrls: ['./corpus-header.component.scss']
})
export class CorpusHeaderComponent implements OnChanges, OnInit {
    @Input() corpus: Corpus;
    @Input() currentPage: 'search'|'word-models';
    @Input() modelDocumentation: string;

    searchIcon = faMagnifyingGlass;
    wordModelsIcon = faDiagramProject;

    wordModelsPresent: boolean;

    faInfo = faInfoCircle;

    constructor(private dialogService: DialogService) {
    }

    ngOnInit() {
        window.scrollTo(0,0);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.corpus) {
            this.wordModelsPresent = this.corpus.word_models_present;
        }
    }

    public showCorpusInfo(corpus: Corpus) {
        this.dialogService.showDescriptionPage(corpus);
    }

    public showModelInfo() {
        this.dialogService.showDocumentation(
            this.corpus.name + '_wm',
            `Word models of ${this.corpus.title}`,
            this.modelDocumentation,
        );
    }

}
