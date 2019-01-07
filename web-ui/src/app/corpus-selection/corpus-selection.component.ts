import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Corpus } from '../models/corpus';

import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { DialogService } from "./../services/dialog.service";

@Component({
    selector: 'ia-corpus-selection',
    templateUrl: './corpus-selection.component.html',
    styleUrls: ['./corpus-selection.component.scss']
})
export class CorpusSelectionComponent implements OnInit {
    @Input()
    public items: Corpus[];

    constructor(private router: Router, private domSanitizer: DomSanitizer,  private dialogService: DialogService) { }

    ngOnInit() {
    }

    showMoreInfo(corpus: Corpus): void {
        this.dialogService.behavior.next({
            status: 'loading'
        });
        
        let myHtml: string = "<p>Fabulous explanation and details and whatever else is required here</p><p>And more info</p><p><a href='/api/corpusdocument/dar_Concordantietabel_AR-F_vs4.xlsx'>Hier is een link</a></p><p><a href='/api/corpusdocument/dar_Concordantietabel_AR-NF_vs1.xlsx'>Hier is nog een link</a></p>";
        let html = this.domSanitizer.bypassSecurityTrustHtml(myHtml.replace(/<a href=/g, '<a target="_blank" href='));

        this.dialogService.behavior.next({
            identifier: corpus.title,
            html: html,
            title: `More info about the ${corpus.title} corpus`,
            status: 'show',
            footer: null
        });
    }

    navigateToCorpus(event: any, corpusName: string): void {
        if (!event.target.classList.contains('moreInfoLink')) {
            this.router.navigate(['/search', corpusName])
        }
    }
}
