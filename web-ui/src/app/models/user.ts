import { UserRole } from './user-role';

export class User {
    constructor(public name, public roles: UserRole[]) {
    }

    public hasRole(name): boolean {
        return this.roles.findIndex(x => x.name == name) >= 0;
    }
}

