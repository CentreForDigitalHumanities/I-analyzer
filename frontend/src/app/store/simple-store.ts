import { BehaviorSubject } from 'rxjs';
import { Store } from './types';
import { Params } from '@angular/router';

/** simple store that does not depend on services or routing
 *
 * Stores parameters in an internal BehaviorSubject. Can be used
 * for testing or to manage stand-alone models.
 */
export class SimpleStore implements Store {
    paramUpdates$ = new BehaviorSubject<Params>({});
    params$ = this.paramUpdates$.pipe();
};
