import { Query, UserRole } from '../models/index';

export class User {
    constructor(public id, public name, public roles: UserRole[],
        /**
         * The download limit for this user, will be 0 if there is no limit.
         */
        public downloadLimit: number = 0, public queries: Query[]) {
  
    }

    public hasRole(role): boolean {
        return this.roles.findIndex(x => x.name == role) >= 0;
    }
}
