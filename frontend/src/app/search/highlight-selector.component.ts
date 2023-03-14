import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { QueryModel } from '../models';


const HIGHLIGHT = 200;

@Component({
  selector: 'ia-highlight-selector',
  templateUrl: './highlight-selector.component.html',
  styleUrls: ['./highlight-selector.component.scss']
})
export class HighlightSelectorComponent implements OnChanges {
    @Input() queryModel: QueryModel;
    public highlight: number = HIGHLIGHT;

    constructor() {
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.queryModel) {
            this.queryModel.update.subscribe(this.setStateFromQueryModel.bind(this));
        }
    }

    setStateFromQueryModel() {
        this.highlight = this.queryModel.highlightSize;
    }


    updateHighlightSize(event) {
        const highlightSize = event.target.value;
        this.queryModel.setHighlight(highlightSize);
    }

}
