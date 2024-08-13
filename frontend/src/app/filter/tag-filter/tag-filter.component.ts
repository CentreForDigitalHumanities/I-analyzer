import { Component } from '@angular/core';
import { BaseFilterComponent } from '../base-filter.component';
import { TagFilter } from '@models/tag-filter';
import { TagService } from '@services/tag.service';
import { Observable } from 'rxjs';
import { Tag } from '../../models';

@Component({
    selector: 'ia-tag-filter',
    templateUrl: './tag-filter.component.html',
    styleUrls: ['./tag-filter.component.scss']
})
export class TagFilterComponent extends BaseFilterComponent<TagFilter> {

    tags$: Observable<Tag[]>;

    constructor(private tagService: TagService) {
        super();
        this.tags$ = this.tagService.tags$;
    }

}
