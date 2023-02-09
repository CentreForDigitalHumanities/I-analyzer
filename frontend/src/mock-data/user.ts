import { User } from '../app/models/index';

export class UserServiceMock {
    public currentUser: User = mockUser;

    public getCurrentUser(): Promise<User> {
        return Promise.resolve(this.currentUser);
    }
}

export const mockUser: User = new User(
    42,
    'mouse',
    false,
    10000,
    ['deep thought'],
    false
);
