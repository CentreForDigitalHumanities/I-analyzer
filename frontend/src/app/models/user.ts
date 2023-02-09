import { UserRole } from '../models/index';
import * as _ from 'lodash';

export interface UserResponse {
    id: number;
    username: string;
    email: string;
    downloadLimit: number;
    corpora: string[];
    isAdmin: boolean;
    saml: boolean;
}

export class User {
    constructor(
        public id,
        public name,
        public isAdmin: boolean,
        public downloadLimit: number = 0, // The download limit for this user, will be 0 if there is no limit.
        public accessibleCorpora: string[],
        public isSolisLogin: boolean
    ) {}

    public canAccessCorpus(corpus: string): boolean {
        return _.includes(this.accessibleCorpora, corpus);
    }
}
