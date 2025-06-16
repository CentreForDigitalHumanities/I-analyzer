import * as _ from 'lodash';
import { map, merge, Observable } from 'rxjs'

/**
 * Merge observables into a boolean observable, where each source observable maps to
 * either a stream of "false" events, or a stream of "true" events.
 *
 * For example, you can create a `loading$` observable for an HTTP request, by
 * mapping each time the request is sent to `true`, and each received response to `false`.
 */
export const mergeAsBooleans = (
    observables: { true: Observable<any>[], false: Observable<any>[], }
): Observable<boolean> => {
    const trues = observables.true.map(obs => obs.pipe(map(_.constant(true))));
    const falses = observables.false.map(obs => obs.pipe(map(_.constant(false))));
    return merge(...trues, ...falses);
}
