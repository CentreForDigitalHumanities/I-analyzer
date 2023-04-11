import { Component } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

import { ParamDirective } from '../param/param-directive';
import { highlightFromParams } from '../utils/params';

const HIGHLIGHT = 200;

@Component({
  selector: 'ia-highlight-selector',
  templateUrl: './highlight-selector.component.html',
  styleUrls: ['./highlight-selector.component.scss']
})
export class HighlightSelectorComponent extends ParamDirective {
    public highlight: number = HIGHLIGHT;

    constructor(route: ActivatedRoute, router: Router) {
      super(route, router);
    }

    initialize() {

    }

    teardown() {
        this.setParams({ highlight: null });
    }

    setStateFromParams(params: ParamMap) {
        this.highlight = highlightFromParams(params);
    }


    updateHighlightSize(event) {
        const highlightSize = event.target.value;
        this.setParams({ highlight: highlightSize !== "0" ? highlightSize : null });
    }

}
