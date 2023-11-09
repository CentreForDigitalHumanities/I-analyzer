import { TagServiceMock, mockTags } from '../../mock-data/tag';
import { TagService } from '../services/tag.service';
import { Tag } from './tag';
import { TagFilter } from './tag-filter';



describe('TagFilter', () => {
    const tagService = new TagServiceMock();
    const filter = new TagFilter(tagService as unknown as TagService);

    it('should convert tags to and from a string', () => {
        const reconstruct = (data: Tag[]) => filter.dataFromString(filter.dataToString(data));
        const testReconstruction = (data: Tag[]) => expect(reconstruct(data)).toEqual(data);

        testReconstruction([]);
        testReconstruction([mockTags[0]]);
        testReconstruction([mockTags[0], mockTags[1]]);
    });

    it('should set to a value', () => {
        filter.set([mockTags[0]]);
        expect(filter.data.value.length).toBe(1);
    });
});
