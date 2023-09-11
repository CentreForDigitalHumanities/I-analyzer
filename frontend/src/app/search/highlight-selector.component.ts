import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { QueryModel } from '../models';
import { Subscription } from 'rxjs';


@Component({
  selector: 'ia-highlight-selector',
  templateUrl: './highlight-selector.component.html',
  styleUrls: ['./highlight-selector.component.scss']
})
export class HighlightSelectorComponent implements OnChanges, OnDestroy, OnInit {
    @Input() queryModel: QueryModel;
    public highlight = 0;
    private highlightSubscription: Subscription;

    constructor() {
    }

    ngOnInit() {
        this.highlightSubscription = this.queryModel.update.subscribe(() => {
            this.setStateFromQueryModel();
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.queryModel) {
            this.setStateFromQueryModel();
        }
    }

    ngOnDestroy(): void {
        this.queryModel.setHighlight();
        this.highlightSubscription.unsubscribe();
    }

    setStateFromQueryModel() {
        this.highlight = this.queryModel.highlightSize;
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
