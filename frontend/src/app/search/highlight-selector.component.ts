import { Component, Input } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

import { ParamDirective } from '../param/param-directive';
import { ParamService } from '../services/param.service';

const HIGHLIGHT = 200;

@Component({
  selector: 'ia-highlight-selector',
  templateUrl: './highlight-selector.component.html',
  styleUrls: ['./highlight-selector.component.scss']
})
export class HighlightSelectorComponent extends ParamDirective {
    public highlight: number = HIGHLIGHT;

    constructor(route: ActivatedRoute, router: Router, private paramService: ParamService) {
      super(route, router);
    }

    @Input() queryText;

    initialize() {

    }

    ngOnChanges() {
        if (this.queryText == '' || this.queryText == null) {
            this.setParams({ highlight: null });
        } else {
            this.setParams({ highlight: 100 });
        }
    }

    teardown() {
        this.setParams({ highlight: null });
    }

    setStateFromParams(params: ParamMap) {
        this.highlight = this.paramService.setHighlightFromParams(params);
    }


    updateHighlightSize(event, instruction?: string) {
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
        this.setParams({ highlight: highlightSize !== 0 ? highlightSize : null });
    }

}
