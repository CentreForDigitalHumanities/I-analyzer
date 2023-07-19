import { mockUser } from './user';

export class AuthServiceMock {
    getCurrentUserPromise = () => Promise.resolve(mockUser);
}
