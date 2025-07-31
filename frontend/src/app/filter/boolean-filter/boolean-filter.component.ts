import { Component } from '@angular/core';

import { BaseFilterComponent } from '../base-filter.component';
import { BooleanFilter } from '@models';

@Component({
    selector: 'ia-boolean-filter',
    templateUrl: './boolean-filter.component.html',
    styleUrls: ['./boolean-filter.component.scss'],
    standalone: false
})
export class BooleanFilterComponent extends BaseFilterComponent<BooleanFilter> {
}
