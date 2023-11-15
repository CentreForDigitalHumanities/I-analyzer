import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    Output,
    ViewChild,
} from '@angular/core';
import { faCheck, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import * as _ from 'lodash';
import { Observable, Subject } from 'rxjs';
import { Tag } from '../../models';
import { TagService } from '../../services/tag.service';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'ia-tag-select',
    templateUrl: './tag-select.component.html',
    styleUrls: ['./tag-select.component.scss'],
})
export class TagSelectComponent implements OnDestroy {
    @Input() exclude: Tag[];
    @Output() selection = new EventEmitter<Tag>();
    @Output() cancel = new EventEmitter<void>();

    @ViewChild('tagSelect') tagSelect: ElementRef;

    tags$: Observable<Tag[]>;
    destroy$ = new Subject();

    faCheck = faCheck;
    faTimes = faTimes;
    faPlus = faPlus;

    selectedTag: Tag;

    createMode = false;
    newTagName: string;

    constructor(private tagService: TagService) {
        this.tags$ = this.tagService.tags$;
    }

    filterTags(tags: Tag[], exclude?: Tag[]): Tag[] {
        return _.differenceBy(tags, exclude || [], 'name');
    }

    addTag() {
        this.selection.emit(this.selectedTag);
        this.selectedTag = undefined;
    }

    createTag() {
        this.tagService
            .makeTag(this.newTagName)
            .pipe(takeUntil(this.destroy$))
            .subscribe((res) => {
                this.selection.emit(res);
                this.createMode = false;
            });
    }

    toggleCreate(): void {
        this.selectedTag = undefined;
        this.createMode = !this.createMode;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
