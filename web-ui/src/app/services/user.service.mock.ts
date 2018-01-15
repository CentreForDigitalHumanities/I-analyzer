import { User } from '../models/user';

import { MockCorpusRoles } from '../../mock-data/corpus';

export class UserServiceMock {
    public currentUser: User = new User(42, "admin", [{ name: "admin", description: "" }, ...MockCorpusRoles], 42);

    public getCurrentUserOrFail() {
        return this.currentUser;
    }
}
