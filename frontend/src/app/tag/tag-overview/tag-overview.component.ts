import { Component, OnInit } from '@angular/core';
import { isUndefined } from 'lodash';
import { Corpus, QueryModel, Tag } from '../../models';
import { TagService } from '../../services/tag.service';
import {
    actionIcons,
    documentIcons,
    formIcons,
    scanIcons,
} from '../../shared/icons';
import { CorpusService } from '../../services';
import { findByName } from '../../utils/utils';
import { isTagFilter } from '../../models/tag-filter';

@Component({
    selector: 'ia-tag-overview',
    templateUrl: './tag-overview.component.html',
    styleUrls: ['./tag-overview.component.scss'],
})
export class TagOverviewComponent implements OnInit {
    tags$ = this.tagService.tags$;

    actionIcons = actionIcons;
    formIcons = formIcons;
    scanIcons = scanIcons;
    documentIcons = documentIcons;

    corpora: Corpus[];

    showEditModal = false;
    modalType: 'edit' | 'create';

    editedTag: Partial<Tag>;

    constructor(
        private tagService: TagService,
        private corpusService: CorpusService
    ) {}

    async ngOnInit(): Promise<void> {
        this.corpora = await this.corpusService.get(false);
    }

    delete(tag: Tag) {
        this.tagService.deleteTag(tag).subscribe();
    }

    startEdit(tag: Tag) {
        this.editedTag = tag;
        this.modalType = 'edit';
        this.showEditModal = true;
    }

    startCreate() {
        this.editedTag = { name: undefined, description: undefined };
        this.modalType = 'create';
        this.showEditModal = true;
    }

    cancelEdit() {
        this.editedTag = undefined;
        this.modalType = undefined;
        this.showEditModal = false;
    }

    finishEdit() {
        this.tagService
            .updateTag(this.editedTag as Tag)
            .subscribe(() => this.cancelEdit());
    }

    finishCreate() {
        this.tagService
            .makeTag(this.editedTag.name, this.editedTag.description)
            .subscribe(() => this.cancelEdit());
    }

    tagValid() {
        return !isUndefined(this.editedTag.name);
    }

    makeQueryParams(corpusName, tag) {
        const corpus = findByName(this.corpora, corpusName);

        const query = new QueryModel(corpus);
        const tagfilter = query.filters.find(isTagFilter);
        tagfilter.set([tag.id]);

        const params = query.toQueryParams();
        return params;
    }
}
