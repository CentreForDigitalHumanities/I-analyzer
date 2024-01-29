import { BehaviorSubject } from 'rxjs';
import { Store } from './types';
import { Params } from '@angular/router';
import * as _ from 'lodash';
import { map, scan } from 'rxjs/operators';
import { omitNullParameters } from '../utils/params';

/** simple store that does not depend on services or routing
 *
 * Stores parameters in an internal BehaviorSubject. Can be used
 * for testing or to manage stand-alone models.
 */
export class SimpleStore implements Store {
    paramUpdates$ = new BehaviorSubject<Params>({});
    params$ = new BehaviorSubject<Params>({});

    constructor() {
        this.paramUpdates$.pipe(
            scan(this.merge),
            map(omitNullParameters)
        ).subscribe(params =>
            this.params$.next(params)
        );
    }

    currentParams(): Params {
        return this.params$.value;
    }

    private merge(current: Params, next: Params): Params {
        return  _.assign(_.clone(current), next);
    }
};
