import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { QueryModel } from '../models';


const HIGHLIGHT = 200;

@Component({
  selector: 'ia-highlight-selector',
  templateUrl: './highlight-selector.component.html',
  styleUrls: ['./highlight-selector.component.scss']
})
export class HighlightSelectorComponent implements OnChanges, OnDestroy {
    @Input() queryModel: QueryModel;
    public highlight: number = HIGHLIGHT;

    constructor() {
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.queryModel) {
            this.setStateFromQueryModel();
            this.queryModel.update.subscribe(this.setStateFromQueryModel.bind(this));
        }
    }

    ngOnDestroy(): void {
        this.queryModel.setHighlight(undefined);
    }

    setStateFromQueryModel() {
        this.highlight = this.queryModel.highlightSize;
    }


    updateHighlightSize(event) {
        const highlightSize = event.target.value;
        this.queryModel.setHighlight(highlightSize);
    }

}
