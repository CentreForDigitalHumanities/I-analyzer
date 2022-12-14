import { Directive } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Corpus, Download, Query } from '../models';
import { CorpusService } from '../services';

@Directive({
  selector: '[iaHistory]'
})
export class HistoryDirective {
    corpora: Corpus[];
    corpusMenuItems: MenuItem[];

    constructor(public corpusService: CorpusService) { }

    retrieveCorpora() {
        this.corpusService.get().then((items) => {
            this.corpora = items;
            this.corpusMenuItems = items.map(corpus => ({ label: corpus.title, value: corpus.name }) );
        }).catch(error => {
            console.log(error);
        });
    }

    sortByDate<Item extends Download|Query>(downloads: Item[]): Item[] {
        return downloads.sort((a, b) =>
            new Date(b.started).getTime() - new Date(a.started).getTime()
        );
    }


    corpusTitle(corpusName: string): string {
        return this.corpora.find(corpus => corpus.name == corpusName).title || corpusName;
    }
}
