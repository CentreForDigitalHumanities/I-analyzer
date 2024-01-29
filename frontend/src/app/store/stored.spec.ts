import { Params } from '@angular/router';
import { Stored } from './stored';
import * as _ from 'lodash';
import { SimpleStore } from './simple-store';
import { Store } from './types';


describe('Stored', () => {
    interface State {
        foo: string;
        bar: string;
    };

    class TestModel extends Stored<State> {
        protected keysInStore = ['foobar'];

        constructor(_store: Store) {
            super(_store);
            this.connectToStore();
        }

        protected stateToStore(state: State): Params {
            return {foobar: `${state.foo},${state.bar}`};
        }

        protected storeToState(params: Params): State {
            if ('foobar' in params) {
                const [foo, bar] = (params.foobar as string).split(',');
                return {foo, bar};
            } else {
                return {
                    foo: 'foo',
                    bar: 'bar'
                };
            }
        }
    }

    let store: SimpleStore;
    let obj: TestModel;

    beforeEach(() => {
        store = new SimpleStore();
        obj = new TestModel(store);
    });

    it('should create', () => {
        expect(obj).toBeTruthy();
        expect(obj.state$.value).toEqual({
            foo: 'foo',
            bar: 'bar'
        });
    });

    it('should create from a non-empty store', () => {
        store = new SimpleStore();
        store.paramUpdates$.next({foobar: 'baz,bar'});
        obj = new TestModel(store);
        expect(obj.state$.value).toEqual({
            foo: 'baz',
            bar: 'bar',
        });
    });

    it('should set parameters', () => {
        obj.setParams({foo: 'baz'});
        expect(obj.state$.value).toEqual({
            foo: 'baz',
            bar: 'bar'
        });
    });

    it('should update the store', () => {
        obj.setParams({foo: 'baz'});
        expect(store.currentParams()).toEqual({foobar: 'baz,bar'});
    });

    it('should listen to updates on the store', () => {
        store.paramUpdates$.next({foobar: 'foo,baz'});
        expect(obj.state$.value).toEqual({
            foo: 'foo',
            bar: 'baz',
        });
    });

    it('should stop listening when completed', () => {
        obj.complete();
        store.paramUpdates$.next({foobar: 'foo,baz'});
        expect(obj.state$.value).toEqual({
            foo: 'foo',
            bar: 'bar',
        });
    });

    it('should reset values when completed', () => {
        obj.setParams({foo: 'baz'});
        obj.complete();
        expect(store.currentParams()).toEqual({});
    });
});
