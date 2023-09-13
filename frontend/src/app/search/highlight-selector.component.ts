import { Component, Input, OnDestroy } from '@angular/core';
import { QueryModel } from '../models';


@Component({
  selector: 'ia-highlight-selector',
  templateUrl: './highlight-selector.component.html',
  styleUrls: ['./highlight-selector.component.scss']
})
export class HighlightSelectorComponent implements OnDestroy {
    @Input() queryModel: QueryModel;

    constructor() {
    }

    get highlight(): number {
        return this.queryModel?.highlightSize;
    }

    get highlightDisabled(): boolean {
        return this.queryModel?.highlightDisabled;
    }

    ngOnDestroy(): void {
        this.queryModel.setHighlight();
    }

    updateHighlightSize(instruction?: string) {
        if (instruction === 'on' && !this.queryModel.highlightSize) {
            this.queryModel.setHighlight(200);
        } else if (instruction === 'more' && this.queryModel.highlightSize < 800) {
            this.queryModel.setHighlight(this.queryModel.highlightSize + 200);
        } else if (instruction === 'less' && this.queryModel.highlightSize > 200) {
            this.queryModel.setHighlight(this.queryModel.highlightSize - 200);
        } else if (instruction === 'off') {
            this.queryModel.setHighlight();
        }
    }

}
