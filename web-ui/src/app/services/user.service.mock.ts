import { User } from '../models/user';

export class UserServiceMock {
    public currentUser: User = new User(42, "admin", [{ name: "admin", description: "" }], 42);

    public getCurrentUserOrFail() {
        return this.currentUser;
    }
}
