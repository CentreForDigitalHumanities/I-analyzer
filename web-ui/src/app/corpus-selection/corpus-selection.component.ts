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

    constructor() { }

    ngOnInit() {
    }

}
