import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { QueryModel } from '../models';
import { Subscription } from 'rxjs';


@Component({
  selector: 'ia-highlight-selector',
  templateUrl: './highlight-selector.component.html',
  styleUrls: ['./highlight-selector.component.scss']
})
export class HighlightSelectorComponent implements OnChanges, OnDestroy {
    @Input() queryModel: QueryModel;
    private highlightSubscription: Subscription;
    public highlight: number = 0;

    constructor() {
    }

    ngOnInit() {
        this.highlightSubscription = this.queryModel.update.subscribe(() => {
            this.setStateFromQueryModel()
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.queryModel) {
            this.setStateFromQueryModel();
        }
    }

    ngOnDestroy(): void {
        this.queryModel.setHighlight(0);
        this.highlightSubscription.unsubscribe();
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
