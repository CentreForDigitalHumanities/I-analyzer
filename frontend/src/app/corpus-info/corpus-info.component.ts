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

    tabs = [
        {
            name: 'general',
            title: 'General information',
            property: 'descriptionpage',
        }, {
            name: 'fields',
            title: 'Fields',
            property: 'fields',
        }, {
            name: 'models',
            title: 'Word models',
            property: 'word_models_present',
        }
    ];

    currentTab = new BehaviorSubject<'general'|'fields'|'models'>(
        'general'
    );

    constructor(private corpusService: CorpusService, private apiService: ApiService, private wordModelsService: WordmodelsService) { }

    get minYear() {
        return this.corpus.minDate.getFullYear();
    }

    get maxYear() {
        return this.corpus.maxDate.getFullYear();
    }

    get languages() {
        return this.corpus.languages.join(', ');
    }

    ngOnInit(): void {
        this.corpusService.currentCorpus.subscribe(this.setCorpus.bind(this));
    }

    setCorpus(corpus: Corpus) {
        this.corpus = corpus;
        this.apiService.corpusdescription({filename: corpus.descriptionpage, corpus: corpus.name})
            .then(marked.parse)
            .then(doc => this.description = doc);
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
