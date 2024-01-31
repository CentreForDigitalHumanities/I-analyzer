import { SimpleStore } from './simple-store';

describe('SimpleStore', () => {
    let store: SimpleStore;

    beforeEach(() => {
        store = new SimpleStore();
    });

    it('should create', () => {
        expect(store.currentParams()).toEqual({});
    });

    it('should set parameters', () => {
        store.paramUpdates$.next({foo: 'bar'});
        expect(store.currentParams()).toEqual({foo: 'bar'});
    });

    it('should merge updates', () => {
        store.paramUpdates$.next({foo: 'bar'});
        store.paramUpdates$.next({bar: 'baz'});
        expect(store.currentParams()).toEqual({
            foo: 'bar',
            bar: 'baz',
        });
    });

    it('should show the latest version of a parameter', () => {
        store.paramUpdates$.next({foo: 'bar'});
        store.paramUpdates$.next({foo: 'baz'});
        expect(store.currentParams()).toEqual({foo: 'baz'});
    });

    it('should drop parameters set to null', () => {
        store.paramUpdates$.next({foo: 'bar'});
        store.paramUpdates$.next({foo: null});
        expect(store.currentParams()).toEqual({});
    });

    it('should represent values as strings', () => {
        store.paramUpdates$.next({foo: 1});
        expect(store.currentParams()).toEqual({foo: '1'});
    });
});
