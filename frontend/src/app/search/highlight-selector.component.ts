import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { QueryModel } from '../models';


const HIGHLIGHT = 100;

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


    // updateHighlightSize(event) {
    //     const highlightSize = event.target.value;
    //     this.queryModel.setHighlight(highlightSize);
    // }

    updateHighlightSize(instruction?: string) {
        let highlightSize = this.highlight;
        if (instruction == 'on' && highlightSize == 0) {
            highlightSize = 100;
        } else if (instruction == 'more' && highlightSize < 800) {
            highlightSize += 100;
        } else if (instruction == 'less' && highlightSize > 120) {
            highlightSize -= 100;
        } else if (instruction == 'off') {
            highlightSize = 0;
        }
        this.queryModel.setHighlight(highlightSize);

        // this.setParams({ highlight: highlightSize !== 0 ? highlightSize : null });
    }

}
