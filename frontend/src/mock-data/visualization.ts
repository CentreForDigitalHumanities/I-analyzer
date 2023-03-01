export class visualizationServiceMock {
    public async getRelatedWords() {}
    public async getNgramTasks() {
        return Promise.resolve({success: true, task_ids: ['123']});
    }
}
