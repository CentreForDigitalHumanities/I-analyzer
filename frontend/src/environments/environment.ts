// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.
import { version } from './version';

export const environment = {
    production: false,
    appName: 'I-Analyzer',
    aboutPage: 'ianalyzer',
    apiUrl: '/api/',
    adminUrl: '/admin/',
    samlLogoutUrl: '/users/saml2/logout/',
    showSolis: true,
    runInIFrame: false,
    directDownloadLimit: 1000,
    version,
    sourceUrl: 'https://github.com/CentreForDigitalHumanities/I-analyzer/',
    logos: undefined,
    showCorpusFilters: true,
};
