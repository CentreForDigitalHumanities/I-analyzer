import { User, UserResponse } from '../app/models/index';


export const mockUser: User = new User(42, 'mouse', false, 10000, false, true);

export const mockUserResponse: UserResponse = {
    id: 42,
    username: 'mouse',
    is_admin: false,
    email: 'mighty@mouse.com',
    download_limit: 10000,
    saml: false,
    profile: {
        enable_search_history: true,
    },
};
