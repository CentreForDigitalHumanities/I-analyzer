import { Params } from '@angular/router';
import { Observable, Observer } from 'rxjs';

export interface Store {
    params$: Observable<Params>;
    paramUpdates$: Observer<Params>;

    currentParams(): Params;
}
