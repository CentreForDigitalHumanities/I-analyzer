import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Corpus } from '../models/corpus';

import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ManualService } from "./../services/manual.service";

@Component({
    selector: 'ia-corpus-selection',
    templateUrl: './corpus-selection.component.html',
    styleUrls: ['./corpus-selection.component.scss']
})
export class CorpusSelectionComponent implements OnInit {
    @Input()
    public items: Corpus[];

    constructor(private router: Router, private domSanitizer: DomSanitizer,  private manualService: ManualService) { }

    ngOnInit() {
    }

    showMoreInfo(corpus: Corpus): void {
        this.manualService.showDescriptionPage(corpus);
    }

    navigateToCorpus(event: any, corpusName: string): void {
        if (!event.target.classList.contains('moreInfoLink')) {
            this.router.navigate(['/search', corpusName])
        }
    }
}
