import { TagService } from '../services/tag.service';
import { BaseFilter } from './base-filter';
import { Tag } from './tag';

const SEPARATOR = ',';

export class TagFilter extends BaseFilter<void, Tag[]> {
    description = 'filter tagged documents';
    filterType = 'TagFilter';
    routeParamName = 'tags';

    constructor(private tagService: TagService) {
        super();
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
        return userTags.filter(included);
    }

    private tagToString(tag: Tag): string {
        return tag.id.toString();
    }
}
