export class visualizationServiceMock {
    public async getRelatedWords() {}
    public async getNgramTasks() {
        return Promise.resolve({task_ids: ['ngram-task-id']});
    }
}
