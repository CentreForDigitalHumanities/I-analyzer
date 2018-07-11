import { User, Query } from '../models/index';

import { MockCorpusRoles } from '../../mock-data/corpus';
import { UserService } from '.';

export class UserServiceMock {
    public query: Query = new Query({ queryText: "The ultimate question for life, the universe and everything" },
        "times", 42);
    public currentUser: User = new User(42, "admin", [{ name: "admin", description: "" }, ...MockCorpusRoles], 10000,
        [this.query]);

    public getCurrentUser(): Promise<User> {
        return Promise.resolve(this.currentUser);
    }
}
