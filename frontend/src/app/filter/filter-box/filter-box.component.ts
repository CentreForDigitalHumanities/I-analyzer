import { Component, Input } from '@angular/core';
import { QueryModel, SearchFilter } from '../../models';
import { faFilter, faTrashCan } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'ia-filter-box',
    templateUrl: './filter-box.component.html',
    styleUrls: ['./filter-box.component.scss']
})
export class FilterBoxComponent {
    @Input() filter: SearchFilter;
    @Input() queryModel: QueryModel;

    icons = {
        clear: faTrashCan,
        toggle: faFilter,
    };
}
