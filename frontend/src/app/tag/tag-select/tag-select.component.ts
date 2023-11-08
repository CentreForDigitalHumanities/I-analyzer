import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { TagService } from '../../services/tag.service';
import { Observable } from 'rxjs';
import { Tag } from '../../models';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import * as _ from 'lodash';


@Component({
    selector: 'ia-tag-select',
    templateUrl: './tag-select.component.html',
    styleUrls: ['./tag-select.component.scss'],
})
export class TagSelectComponent {
    @Input() exclude: Tag[];
    @Output() selection = new EventEmitter<Tag>();
    @Output() cancel = new EventEmitter<void>();

    @ViewChild('tagSelect') tagSelect: ElementRef;

    tags$: Observable<Tag[]>;

    faCheck = faCheck;
    faTimes = faTimes;

    selectedTag: Tag;

    constructor(private tagService: TagService) {
        this.tags$ = this.tagService.tags$;
    }

    filterTags(tags: Tag[], exclude?: Tag[]): Tag[] {
        return _.differenceBy(tags, exclude || [], 'name');
    }

    confirm() {
        this.selection.emit(this.selectedTag);
        this.selectedTag = undefined;
    }
}
