import { User, UserResponse } from '../app/models/index';

export class UserServiceMock {
    public currentUser: User = mockUser;

    public getCurrentUser(): Promise<User> {
        return Promise.resolve(this.currentUser);
    }
}

export const mockUser: User = new User(42, 'mouse', false, 10000, false, true);

export const mockUserResponse: UserResponse = {
    id: 42,
    username: 'mouse',
    is_admin: false,
    email: 'mighty@mouse.com',
    download_limit: 10000,
    saml: false,
    enable_search_history: true,
};
