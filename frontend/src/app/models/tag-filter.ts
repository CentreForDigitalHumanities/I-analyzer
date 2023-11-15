import { Observable } from 'rxjs';
import { TagService } from '../services/tag.service';
import { BaseFilter, FilterInterface } from './base-filter';
import { Tag } from './tag';

export const TAG_FILTER = 'TagFilter';

const SEPARATOR = ',';

export class TagFilter extends BaseFilter<void, Tag[]> {
    displayName = 'Your tags';
    description = 'select tagged documents';
    filterType = TAG_FILTER;
    routeParamName = 'tags';

    options$: Observable<Tag[]>;

    constructor(private tagService: TagService) {
        super();
        this.options$ = this.tagService.tags$;
    }

    makeDefaultData(): Tag[] {
        return [];
    }

    dataToString(data: Tag[]): string {
        const ids = data.map(this.tagToString);
        return ids.join(SEPARATOR);
    }

    dataFromString(value: string): Tag[] {
        const ids = value.split(SEPARATOR);
        const included = (tag: Tag) => ids.includes(this.tagToString(tag));
        const userTags = this.tagService.tags$.value;
        return userTags?.filter(included) || [];
    }

    dataToAPI(data: Tag[]): number[] {
        if (data?.length) {
            return data.map(t => t.id);
        }
    }

    private tagToString(tag: Tag): string {
        return tag.id.toString();
    }
}

export const isTagFilter = (filter: FilterInterface): filter is TagFilter =>
    filter.filterType === TAG_FILTER;
