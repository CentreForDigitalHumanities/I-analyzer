import { Component, Input, OnInit } from '@angular/core';
import { Corpus } from '../models/corpus';

@Component({
    selector: 'corpus-list',
    templateUrl: './corpus-list.component.html',
    styleUrls: ['./corpus-list.component.scss']
})
export class CorpusListComponent implements OnInit {
    @Input()
    public items: Corpus[];

    constructor() { }

    ngOnInit() {
    }

}
