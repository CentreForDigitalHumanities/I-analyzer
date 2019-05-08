import { User } from '../models/index';

export class UserServiceMock {
    public currentUser: User = new User(42, "mouse", { name: "superuser", description: "users who can access deep thought", 
        corpora:[{name: "deep thought", description: "supercomputer database"}]}, 10000,
        false);

    public getCurrentUser(): Promise<User> {
        return Promise.resolve(this.currentUser);
    }
}
