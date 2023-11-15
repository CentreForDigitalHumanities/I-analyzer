import { Component, OnInit } from '@angular/core';
import { ApiService, CorpusService, WordmodelsService } from '../services';
import { Corpus, FieldCoverage } from '../models';
import { marked } from 'marked';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'ia-corpus-info',
  templateUrl: './corpus-info.component.html',
  styleUrls: ['./corpus-info.component.scss']
})
export class CorpusInfoComponent implements OnInit {
    corpus: Corpus;

    description: string;
    wordModelDocumentation: string;
    fieldCoverage: FieldCoverage;


    constructor(private corpusService: CorpusService, private apiService: ApiService, private wordModelsService: WordmodelsService) { }

    ngOnInit(): void {
        this.corpusService.currentCorpus.subscribe(this.setCorpus.bind(this));
    }

    setCorpus(corpus: Corpus) {
        this.corpus = corpus;
        if (corpus.descriptionpage) {
            this.apiService.corpusdescription({filename: corpus.descriptionpage, corpus: corpus.name})
            .then(marked.parse)
                .then(doc => this.description = doc);
        }
        this.apiService.fieldCoverage(corpus.name).then(
            result => this.fieldCoverage = result
        );
        if (this.corpus.word_models_present) {
            this.wordModelsService.wordModelsDocumentationRequest({corpus_name: this.corpus.name})
                .then(result => marked.parse(result.documentation))
                .then(doc => this.wordModelDocumentation = doc);
        }
    }


}
