# Frontend: deep routing and state management

Complex state management, especially state management that uses deep routing, is preferably handled through models. Typically, a model is just a normal class that you can instantiate in a component:

```typescript
class MyModel {
    // ...
}
```

A _model_ handles data, API calls, and the state of the user's workflow, and is kept separate from Angular components. Components act as _views_ and/or _controllers_, and their script is aimed at translating between the UI and the model.

This keeps components lightweight and makes them more flexible: because the core data is implemented independently, you can split a component, swap a checkbox for a dropdown, etc. without messing up the data.

## Model construction

Usually, a model is created in the highest component that needs it, by calling `new MyModel()` - either when the component is created or when the model becomes relevant. You can share an instance of a model between components by providing it as input.

### Dependency injection: providing services to models

More complex models may require services to make API calls, or listen to the global state of the application.

In those cases, provide the service as a private member variable in the constructor of the model:

```typescript
class MyModel {
    constructor(
        private apiService: ApiService,
    ) {
        // ...
    }
}
```

When you create the model in a component (or directive), the required services should be required to the component through dependency injection.

```typescript
@Component{
    selector: 'my-component',
    templateUrl: './my-component.component.html',
}
class MyComponent {
    model: MyModel;

    constructor(
        private apiService: ApiService,,
    ) {
        model = new MyModel(apiService);
    }
}
```

### Dependency injection: providing models

In some cases, it may make sense to add an `@Injectable` decorator to the model so it can be provided through dependency injection. This makes sense when, in your injection context, you'll have a clear sense of "the" instance that can be provided, so you're not handling multiple instances. Making a model available through DI also requires that all arguments used in the constructor are also available through DI.

The advantage is that:
- the arguments to the the model are automatically injected
- it can simplify the lifecycles of components/directives because the model is immediately available in the constructor, rather than the first `ngOnInit`/`ngOnChanges` call.

However, we don't currently apply this anywhere.

## Storing model states

To unify the state management of models, models should extend the [`StoreSync` class](/frontend/src/app/store/store-sync.ts.ts). Objects in this class connect to a `Store` that will keep track of their parameters.

Stores keep track of data that is updated over time, and are explained in more detail below. You can connect multiple models to the same store. (Usually from different classes.)

A minimal implementation of a stored model would look something like this:

```typescript
interface MyState {
    foo: string
}

class MyModel extends StoreSync<MyState> {
    keysInStore = ['foo'];

    constructor(store: Store) {
        super(store);
        this.connectToStore();
    }

    storeToState(params): MyState {
        return {
            foo: params['foo'] || ''
        };
    }

    stateToStore(state: MyState) {
        return {
            foo: state.foo || null
        };
    }
}
```

The `StoreSync` class provides the main ways in which you can interact with the model:
- a BehaviorSubject `state$` which tracks the latest state of the model based on the store.
- a method `setParams()` which updates some or all of the properties in the model's state by sending an update to the store.
- a method `complete()`: the model will stop observing the store and reject any further updates. It will also send an update to the store to reset its own state.

See [store-sync.ts](/frontend/src/app/store/store-sync.ts) for the exact specification. In practice, the methods can be used like this:

```typescript
@Component{
    selector: 'my-component',
    templateUrl: './my-component.component.html',
}
class MyComponent implements OnInit, OnDestroy {
    myModel: MyModel;

    ngOnInit() {
        const store = new SimpleStore();
        this.myModel = newModel(store);

        console.log(this.myModel.state$.value);
        // { 'foo': '' }
    }

    exampleUpdate() {
        this.myModel.setParams({foo: 'example'});
        console.log(this.myModel.state$.value);
        // { 'foo': 'example' }
    }

    ngOnDestroy() {
        this.myModel.complete();
    }
}
```

Notes:

The methods `storeToState` and `stateToStore` have to be implemented on the model class. They translate between stored strings and whatever is more convenient as an internal state. This is trivial in the example above, but often comes in handy. These functions must be each other's inverse. There should be unit tests to confirm this.

Note that the constructor of `MyModel` calls the method `connectToStore`. This initialises the `state$` observable based on the current state of the store, and creates a subscription to the store. You should call this method in the constructor. It's not called in the constructor of `StoreSync` because you may want to set some properties specific to your model before your call it (`connectToStore` uses `storeToState` to set the initial state).

`keysInStore` specifies the specific keys in the store's state that the model interacts with. The model will only listen to changes in those keys, and will reset them when it is completed.

### Using StoreSync as a base class for components or directives

It is technically possible to use `StoreSync` as a parent class for a component or directive, rather than a data model. That will look something like this:

```typescript
type Data = { foo: string };

@Component{
    selector: 'my-component',
    templateUrl: './my-component.component.html',
}
class MyComponent extends StoreSync<Data> implements OnDestroy  {

    constructor(
        routerStoreService: RouterStoreService,
    ) {
        super(routerStoreService);
        this.connectToStore();
    }

    ngOnDestroy() {
        this.complete();
    }
}
```

This isn't recommended, as it suggests your component is handling significant state management that would be more maintainable if were outfactored to a model (for the reasons describe in the first section).

## Stores

A store keeps track the states of one or more models. There are two store classes:
- The [`RouterStoreService`](/frontend/src/app/store/router-store.service.ts) synchronises its state with the query parameters in the route.
- The [`SimpleStore`](/frontend/src/app/store/simple-store.ts) just stores the data internally and doesn't use any backend.

Crucially, `StoreSync` models don't care which store class you use: they implement the same API. This API consists of three endpoints:

- `params$`: an observable of the stored state
- `currentParams()`: get the current state synchronously, rather than as an observable
- `paramUpdates$`: an observer to which updates are pushed

The state of a store is always an object. Each model class listens to a pre-defined list of keys in this object. If you set the value of a key to `null`, it will be removed.

Because the `RouterStoreService` stores data in the address bar of the browser, the value of stored keys is always a string. So if you call `store.paramUpdates$.next({a: 5})`, the `params$` observable will return the value as `{a: '5'}`. The `SimpleStore` mimicks this behaviour for consistency.
