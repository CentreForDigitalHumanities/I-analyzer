import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Corpus } from '../models';
import { CorpusService } from '../services';

@Component({
  selector: 'ia-document-page',
  templateUrl: './document-page.component.html',
  styleUrls: ['./document-page.component.scss']
})
export class DocumentPageComponent implements OnInit {
    corpus: Corpus;
    documentId: string;

    constructor(
        private corpusService: CorpusService,
        private activatedRoute: ActivatedRoute,
    ) { }

    ngOnInit(): void {
        this.documentId = this.activatedRoute.snapshot.params['id'];
        this.corpusService.currentCorpus.subscribe(corpus =>
            this.corpus = corpus
        );
    }

}
