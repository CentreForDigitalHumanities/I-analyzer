import { Component, OnInit } from '@angular/core';
import { TagService } from '../../services/tag.service';
import { Observable } from 'rxjs';
import { Tag } from '../../models';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'ia-tag-select',
    templateUrl: './tag-select.component.html',
    styleUrls: ['./tag-select.component.scss']
})
export class TagSelectComponent implements OnInit {
    tags$: Observable<Tag[]>;

    faCheck = faCheck;
    faTimes = faTimes;

    constructor(private tagService: TagService) {
        this.tags$ = this.tagService.tags$;
    }

    ngOnInit(): void {
    }

}
