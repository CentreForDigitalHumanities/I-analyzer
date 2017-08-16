import { Component, OnInit } from '@angular/core';
import { Corpus } from '../models/corpus';
import { CorpusService } from '../services/index';

@Component({
    selector: 'home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
    public items: Corpus[];

    constructor(private corpusService: CorpusService) { }

    ngOnInit() {
        this.corpusService.get().then((items) => this.items = items);
    }
}
