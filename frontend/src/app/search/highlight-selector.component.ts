import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { QueryModel } from '../models';


@Component({
  selector: 'ia-highlight-selector',
  templateUrl: './highlight-selector.component.html',
  styleUrls: ['./highlight-selector.component.scss']
})
export class HighlightSelectorComponent implements OnChanges, OnDestroy {
    @Input() queryModel: QueryModel;
    public highlight: number = 0;

    constructor() {
    }

    ngOnChanges(changes: SimpleChanges): void {
    }

    ngOnDestroy(): void {
        this.queryModel.setHighlight(undefined);
    }

    setStateFromQueryModel() {
        this.highlight = this.queryModel.highlightSize;
    }

    updateHighlightSize(instruction?: string) {
        if (instruction == 'on' && this.highlight == 0) {
            this.highlight = 200;
        } else if (instruction == 'more' && this.highlight < 800) {
            this.highlight += 200;
        } else if (instruction == 'less' && this.highlight > 200) {
            this.highlight -= 200;
        } else if (instruction == 'off') {
            this.highlight = 0;
        }
        this.queryModel.setHighlight(this.highlight);
    }

}
