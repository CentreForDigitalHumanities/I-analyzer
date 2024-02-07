import { TagFilter } from './tag-filter';

describe('TagFilter', () => {
    const filter = new TagFilter();

    it('should convert data to and from a string', () => {
        const reconstruct = (data: number[]) => filter.dataFromString(filter.dataToString(data));
        const testReconstruction = (data: number[]) => expect(reconstruct(data)).toEqual(data);

        testReconstruction([]);
        testReconstruction([0]);
        testReconstruction([0, 1]);
    });

    it('should set to a value', () => {
        filter.set([0]);
        expect(filter.data.value.length).toBe(1);
    });
});
