import { environment } from '../../environments/environment';

export const pageTitle = (pageName: string) =>
    `${pageName} - ${environment.appName}`;
