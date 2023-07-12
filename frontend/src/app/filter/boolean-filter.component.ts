import { Component } from '@angular/core';

import { BaseFilterComponent } from './base-filter.component';
import { BooleanFilter } from '../models';

@Component({
  selector: 'ia-boolean-filter',
  templateUrl: './boolean-filter.component.html',
  styleUrls: ['./boolean-filter.component.scss']
})
export class BooleanFilterComponent extends BaseFilterComponent<boolean> {
}
