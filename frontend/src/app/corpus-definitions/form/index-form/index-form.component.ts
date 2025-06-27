import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CorpusDefinition } from '@models/corpus-definition';
import { APIIndexHealth, isComplete, JobStatus } from '@models/indexing';
import { ApiService } from '@services';
import { map, Observable } from 'rxjs';

type DisplayState = {
    status: 'no connection'
} | {
    status: 'index required',
    reason: 'no index' | 'outdated data' | 'outdated configuration' | 'job cancelled',
} | {
    status: 'working',
    jobID: number,
} | {
    status: 'index ready'
} | {
    status: 'indexing failed',
} | {
    status: 'corpus invalid',
    reason: string,
};

const healthToDisplayState = (health: APIIndexHealth): DisplayState => {
    if (
        health.server_active &&
        health.index_active &&
        health.job_status == JobStatus.Done &&
        health.index_compatible &&
        health.includes_latest_data
    ) {
        return { status: 'index ready' };
    }
    if (!health.server_active) {
        return { status: 'no connection' };
    }
    if (health.job_status && !(isComplete(health.job_status))) {
        return { status: 'working', jobID: health.latest_job };
    }
    if (health.job_status == JobStatus.Error) {
        return { status: 'indexing failed' };
    }
    if (!health.corpus_ready_to_index) {
        return { status: 'corpus invalid', reason: health.corpus_validation_feedback };
    }
    if (!health.index_active) {
        return { status: 'index required', reason: 'no index' };
    }
    if (!health.index_compatible) {
        return { status: 'index required', reason: 'outdated configuration' };
    }
    if (!health.includes_latest_data) {
        return { status: 'index required', reason: 'outdated data' };
    }
    if (health.job_status == JobStatus.Aborted || health.job_status == JobStatus.Cancelled) {
        return { status: 'index required', reason: 'job cancelled' };
    }
};

@Component({
    selector: 'ia-index-form',
    templateUrl: './index-form.component.html',
    styleUrl: './index-form.component.scss'
})
export class IndexFormComponent implements OnChanges {
    @Input({required: true}) corpus: CorpusDefinition;

    health$?: Observable<APIIndexHealth>;
    state$?: Observable<DisplayState>;

    constructor(
        private apiService: ApiService,
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.corpus) {
            this.health$ = this.apiService.getIndexHealth(this.corpus.id);
            this.state$ = this.health$.pipe(
                map(healthToDisplayState)
            );
        }
    }
}
