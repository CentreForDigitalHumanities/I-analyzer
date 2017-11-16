import { UserRole } from './user-role';

export class User {
    constructor(public id, public name, public roles: UserRole[], public downloadLimit: number) {
    }

    public hasRole(role): boolean {
        return this.roles.findIndex(x => x.name == role) >= 0;
    }
}

