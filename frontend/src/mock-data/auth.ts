import { of } from 'rxjs';
import { mockUser } from './user';

export class AuthServiceMock {
    currentUser$ = of(mockUser);
    isAuthenticated$ = of(1);
    getCurrentUserPromise = () => Promise.resolve(mockUser);
    getCurrentUser = () => mockUser;
    changePassword = () => of({detail: 'Password changed successfully.'});
    updateSettings = () => of(mockUser);
}

export class UnauthenticatedMock {
    currentUser$ = of(null);
    isAuthenticated$ = of(0);
    getCurrentUserPromise = () => Promise.resolve(null);
    getCurrentUser = () => null;
}
