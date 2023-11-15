import { Component } from '@angular/core';
import { BaseFilterComponent } from '../base-filter.component';
import { TagFilter } from '../../models/tag-filter';

@Component({
    selector: 'ia-tag-filter',
    templateUrl: './tag-filter.component.html',
    styleUrls: ['./tag-filter.component.scss']
})
export class TagFilterComponent extends BaseFilterComponent<TagFilter> {

}
