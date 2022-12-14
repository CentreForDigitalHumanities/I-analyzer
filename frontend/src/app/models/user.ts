import { UserRole } from '../models/index';

export class User {
    constructor(public id, public name, public role: UserRole,
        /**
         * The download limit for this user, will be 0 if there is no limit.
         */
        public downloadLimit: number = 0, public isSolisLogin: boolean) {

    }

    public canAccessCorpus(corpus: string): boolean {
        return this.role.corpora.findIndex(x => x.name == corpus)>=0;
    }

    public hasRole(role: string): boolean {
        return this.role.name == role;
    }
}
