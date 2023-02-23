import * as _ from 'lodash';

export interface UserResponse {
    id: number;
    username: string;
    email: string;
    download_limit: number;
    is_admin: boolean;
    saml: boolean;
}

export class User {
    constructor(
        public id,
        public name,
        public isAdmin: boolean,
        public downloadLimit: number = 0, // The download limit for this user, will be 0 if there is no limit.
        public isSolisLogin: boolean
    ) {}
}
