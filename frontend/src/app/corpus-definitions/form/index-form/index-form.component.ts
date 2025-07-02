import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CorpusDefinition } from '@models/corpus-definition';
import { APIIndexHealth, isComplete, JobStatus } from '@models/indexing';
import { ApiService } from '@services';
import * as _ from 'lodash';
import { map, Subject, switchMap } from 'rxjs';

/** Possible states for the interface of this component */
type DisplayState = {
    // connection issues in the backend (indexing disabled)
    status: 'no connection'
} | {
    // indexing available and required to use the corpus
    status: 'index required',
    // there can be several reasons for this; note that these are not mutually exclusive,
    // but reporting one the user is enough. Listed here in order of preference,
    // e.g. if the data is outdated and the job was cancelled, just say the data is outdated.
    reason: 'no index' | 'outdated data' | 'outdated configuration' | 'job cancelled',
} | {
    // index in progress
    status: 'working',
    jobID: number,
} | {
    // index complete (indexing disabled, corpus can be activated)
    status: 'index ready'
} | {
    // index job failed (should never happen, user must contact admin)
    status: 'indexing failed',
} | {
    // corpus not index-ready (e.g. missing data or fields)
    status: 'corpus invalid',
    reason: string,
};

/** Converts the API index health response to a display state for this component.
 *
 * Breaks down possible scenarios.
 */
const healthToDisplayState = (health: APIIndexHealth): DisplayState => {
    // all requirements for the "ready" state
    if (
        health.server_active &&
        health.index_active &&
        health.job_status == JobStatus.Done &&
        health.index_compatible &&
        health.includes_latest_data
    ) {
        return { status: 'index ready' };
    }
    // otherwise, go over alternatives
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
export class IndexFormComponent implements OnChanges, OnDestroy {
    @Input({required: true}) corpus: CorpusDefinition;

    state$ = new Subject<DisplayState>;
    destroy$ = new Subject<void>();

    constructor(
        private apiService: ApiService,
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.corpus) {
            this.apiService.getIndexHealth(this.corpus.id).subscribe(health => {
                const state = healthToDisplayState(health);
                this.state$.next(state);
                if (state.status == 'working') {
                    this.pollJob(state.jobID);
                }
            });
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    startIndex() {
        this.apiService.createIndexJob(this.corpus.id).subscribe((response) =>
            this.pollJob(response.id)
        );
    }

    toggleCorpusActive() {
        this.corpus.active = !this.corpus.active;
        this.corpus.save();
    }

    private pollJob(jobID: number) {
        this.apiService.pollIndexJob(jobID, this.destroy$).pipe(
            switchMap(() => this.apiService.getIndexHealth(this.corpus.id)),
            map(healthToDisplayState),
        ).subscribe(this.state$.next);
    }
}
