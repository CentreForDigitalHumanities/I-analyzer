import { TaskResult } from '@models';

export class VisualizationServiceMock {
    public getRelatedWords() {}
    public async getNgramTasks(): Promise<TaskResult> {
        return Promise.resolve({task_ids: ['ngram-task-id', 'another-task-id']});
    }
}
