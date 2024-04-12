import { Component, OnInit } from '@angular/core';
import { ApiService, CorpusService, WordmodelsService } from '../services';
import { Corpus, CorpusDocumentationPage, FieldCoverage } from '../models';
import { marked } from 'marked';
import { Observable } from 'rxjs';

@Component({
  selector: 'ia-corpus-info',
  templateUrl: './corpus-info.component.html',
  styleUrls: ['./corpus-info.component.scss']
})
export class CorpusInfoComponent implements OnInit {
    corpus: Corpus;

    fieldCoverage: FieldCoverage;

    documentation$: Observable<CorpusDocumentationPage[]>;

    constructor(private corpusService: CorpusService, private apiService: ApiService, private wordModelsService: WordmodelsService) { }

    ngOnInit(): void {
        this.corpusService.currentCorpus.subscribe(this.setCorpus.bind(this));
    }

    setCorpus(corpus: Corpus) {
        this.corpus = corpus;
        this.documentation$ = this.apiService.corpusDocumentation(corpus.name);
        this.apiService.fieldCoverage(corpus.name).then(
            result => this.fieldCoverage = result
        );
    }

    renderMarkdown(content: string): string {
        return marked.parse(content);
    }

}
