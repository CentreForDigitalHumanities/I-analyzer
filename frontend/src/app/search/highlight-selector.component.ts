import { Component } from '@angular/core';
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

    initialize() {

    }

    teardown() {
        this.setParams({ highlight: null });
    }

    setStateFromParams(params: ParamMap) {
        this.highlight = this.paramService.setHighlightFromParams(params);
    }


    updateHighlightSize(event) {
        const highlightSize = event.target.value;
        this.setParams({ highlight: highlightSize !== "0" ? highlightSize : null });
    }

}
