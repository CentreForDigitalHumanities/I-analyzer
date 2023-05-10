import { Component, OnInit } from '@angular/core';
import { ApiService, CorpusService } from '../services';
import { Corpus } from '../models';
import { marked } from 'marked';

@Component({
  selector: 'ia-corpus-info',
  templateUrl: './corpus-info.component.html',
  styleUrls: ['./corpus-info.component.scss']
})
export class CorpusInfoComponent implements OnInit {
    corpus: Corpus;

    description: string;

    constructor(private corpusService: CorpusService, private apiService: ApiService) { }

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
        this.apiService.corpusdescription({filename: corpus.descriptionpage, corpus: corpus.name}).then(
            doc => this.description = marked.parse(doc)
        );
    }

}
