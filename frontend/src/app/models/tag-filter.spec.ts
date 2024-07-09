import { SimpleStore } from '../store/simple-store';
import { Store } from '../store/types';
import { TagFilter } from './tag-filter';

describe('TagFilter', () => {
    let store: Store;
    let filter: TagFilter;

    beforeEach(() => {
        store = new SimpleStore();
        filter = new TagFilter(store);
    });

    it('should convert data to and from a string', () => {
        const reconstruct = (data: number[]) => filter.dataFromString(filter.dataToString(data));
        const testReconstruction = (data: number[]) => expect(reconstruct(data)).toEqual(data);

        testReconstruction([]);
        testReconstruction([0]);
        testReconstruction([0, 1]);
    });

    it('should set to a value', () => {
        filter.set([0]);
        expect(filter.state$.value.data.length).toBe(1);
    });
});
