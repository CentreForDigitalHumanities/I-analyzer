import { BehaviorSubject, Observable } from 'rxjs';
import { QueryModel } from './query';

abstract class Results<Parameters, Result> {
    parameters$: BehaviorSubject<Parameters>;
    result$: Observable<Result>;

    constructor(
        public query: QueryModel,
        initialParameters: Parameters,
    ) {
    }
}
