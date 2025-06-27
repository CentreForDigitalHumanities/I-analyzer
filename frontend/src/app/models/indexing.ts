export enum JobStatus {
    Created = 'created',
    Queued = 'queued',
    Working = 'working',
    Done = 'done',
    Error = 'error',
    Aborted = 'aborted',
    Cancelled = 'cancelled',
}


export interface APIIndexHealth {
    corpus: number;
    server_active: boolean;
    index_compatible: boolean | null;
    latest_job: number | null;
    job_status: JobStatus | null;
    includes_latest_data: boolean | null;
    corpus_ready_to_index: boolean | null;
    corpus_validation_feedback: string | null;
}

export interface APIIndexJob {
    id: number;
    corpus: number;
    status: JobStatus;
}
