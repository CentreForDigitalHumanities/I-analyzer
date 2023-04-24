import { Component, Input, OnInit } from '@angular/core';
import { Corpus } from '../models/corpus';


@Component({
    selector: 'ia-corpus-selection',
    templateUrl: './corpus-selection.component.html',
    styleUrls: ['./corpus-selection.component.scss']
})
export class CorpusSelectionComponent implements OnInit {
    @Input()
    public items: Corpus[];

    minDate = new Date('01/01/1800');
    maxDate = new Date(Date.now());

    constructor() { }

    ngOnInit() {
    }
}
