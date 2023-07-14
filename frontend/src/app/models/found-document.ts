import * as _ from 'lodash';
import { makeContextParams } from '../utils/document-context';
import { Corpus, CorpusField } from './corpus';
import { FieldValues, HighlightResult, SearchHit } from './elasticsearch';
import { Tag } from './tag';
import { Observable } from 'rxjs';
import { TagService } from '../services/tag.service';
import { tap } from 'rxjs/operators';

export class FoundDocument {
    id: string;

    /** relevance score for the query;
     * in [0,1] with 1 being most relevant
     */
    relevance: number;

    /** values for fields */
    fieldValues: FieldValues;

    /** position of the document in the array of results */
    position: number;

    /** highlighted strings */
    highlight: HighlightResult;

    /** tags created on the document */
    tags$: Observable<Tag[]>;

    constructor(
        private tagService: TagService,
        public corpus: Corpus,
        hit: SearchHit,
        maxScore: number = 1
    ) {
        this.id = hit._id;
        this.relevance = hit._score / maxScore;
        this.fieldValues = Object.assign({ id: hit._id }, hit._source);
        this.highlight = hit.highlight;
        this.fetchTags();
    }


    /**
     * whether the document has a "context" that it belongs to
     *
     * e.g. the publication it was a part of
     */
    get hasContext(): boolean {
        const spec = this.corpus.documentContext;

        if (_.isUndefined(spec)) {
            return false;
        }

        const notBlank = value => value !== undefined && value !== null && value !== '';
        const contextValues = spec.contextFields.map(this.fieldValue.bind(this));
        return _.every(contextValues, notBlank);
    }

    /**
     * query parameters for a search request for the context of the document
     *
     * e.g. the publication it was a part of
     */
    get contextQueryParams() {
        return makeContextParams(this, this.corpus);
    }

    fieldValue(field: CorpusField) {
        return this.fieldValues[field.name];
    }

    addTag(tagId: number): void {
        this.tagService.addDocumentTag(this, tagId).pipe(
            tap(this.fetchTags.bind(this))
        ).subscribe();
    }

    removeTag(tag: Tag): void {
        this.tagService.removeDocumentTag(this, tag).pipe(
            tap(this.fetchTags.bind(this))
        ).subscribe();
    }

    private fetchTags(): void {
        this.tags$ = this.tagService.getDocumentTags(this);
    }

}
