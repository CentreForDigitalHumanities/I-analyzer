import { Query, UserRole } from '../models/index';

export class User {
    constructor(public id, public name, public roles: UserRole[], public downloadLimit: number, public queries: Query[]) {
    }

    public hasRole(role): boolean {
        return this.roles.findIndex(x => x.name == role) >= 0;
    }
}

