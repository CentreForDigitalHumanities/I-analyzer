export enum JobStatus {
    Created = 'created',
    Queued = 'queued',
    Working = 'working',
    Done = 'done',
    Error = 'error',
    Aborted = 'aborted',
    Cancelled = 'cancelled',
}

export const isComplete = (status: JobStatus): boolean => {
    return [JobStatus.Done, JobStatus.Error, JobStatus.Aborted, JobStatus.Cancelled].includes(status);
}

export interface APIIndexHealth {
    corpus: number;
    server_active: boolean;
    index_active: boolean | null;
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
