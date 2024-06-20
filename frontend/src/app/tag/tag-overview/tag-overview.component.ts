import { Component, OnInit } from '@angular/core';
import { isUndefined } from 'lodash';
import { Corpus, QueryModel, Tag } from '../../models';
import { isTagFilter } from '../../models/tag-filter';
import { CorpusService } from '../../services';
import { TagService } from '../../services/tag.service';
import { actionIcons, formIcons } from '../../shared/icons';
import { findByName } from '../../utils/utils';
import { Title } from '@angular/platform-browser';
import { pageTitle } from '../../utils/app';

@Component({
    selector: 'ia-tag-overview',
    templateUrl: './tag-overview.component.html',
    styleUrls: ['./tag-overview.component.scss'],
})
export class TagOverviewComponent implements OnInit {
    tags$ = this.tagService.tags$;

    actionIcons = actionIcons;
    formIcons = formIcons;

    corpora: Corpus[];

    modalType: 'edit' | 'create';

    editedTag: Partial<Tag>;

    constructor(
        private tagService: TagService,
        private corpusService: CorpusService,
        private title: Title,
    ) {}

    async ngOnInit(): Promise<void> {
        this.corpora = await this.corpusService.get(false);
        this.tagService.fetch();
        this.title.setTitle(pageTitle('Tags'));
    }

    delete(tag: Tag) {
        this.tagService.deleteTag(tag).subscribe();
    }

    startEdit(tag: Tag) {
        this.editedTag = tag;
        this.modalType = 'edit';
    }

    startCreate() {
        this.editedTag = { name: undefined, description: undefined };
        this.modalType = 'create';
    }

    cancelEdit() {
        this.editedTag = undefined;
        this.modalType = undefined;
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
