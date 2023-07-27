import { NgModule } from '@angular/core';
import { APP_BASE_HREF, TitleCasePipe } from '@angular/common';

import { RouterModule, Routes } from '@angular/router';

import { MenuModule } from 'primeng/menu';
import { DialogModule } from 'primeng/dialog';
import { CookieService } from 'ngx-cookie-service';

import {
    ApiService, ApiRetryService,
    ElasticSearchService, HighlightService, } from './services/index';

import { AppComponent } from './app.component';
import { AboutComponent } from './about/about.component';
import { HomeComponent } from './home/home.component';
import { SearchComponent } from './search/index';
import { ManualComponent } from './manual/manual.component';
import { MenuComponent } from './menu/menu.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { CorpusGuard } from './corpus.guard';
import { LoggedOnGuard } from './logged-on.guard';
import { LoginComponent } from './login/login.component';
import { SearchHistoryComponent, } from './history/search-history/index';
import { RegistrationComponent } from './login/registration/registration.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { DialogComponent } from './dialog/dialog.component';
import { ResetPasswordComponent } from './login/reset-password/reset-password.component';
import { RequestResetComponent } from './login/reset-password/request-reset.component';
import { WordModelsComponent } from './word-models/word-models.component';
import { WordmodelsService } from './services/wordmodels.service';
import { FooterComponent } from './footer/footer.component';
import { DownloadHistoryComponent } from './history/download-history/download-history.component';
import { VerifyEmailComponent } from './login/verify-email/verify-email.component';
import { DocumentPageComponent } from './document-page/document-page.component';
import { CorpusInfoComponent } from './corpus-info/corpus-info.component';
import { SharedModule } from './shared/shared.module';
import { CorpusModule } from './corpus-header/corpus.module';
import { DocumentModule } from './document/document.module';
import { WordModelsModule } from './word-models/word-models.module';
import { HistoryModule } from './history/history.module';
import { CorpusSelectionModule } from './corpus-selection/corpus-selection.module';
import { LoginModule } from './login/login.module';
import { SearchModule } from './search/search.module';
import { ManualModule } from './manual/manual.module';
import { SettingsComponent } from './settings/settings.component';
import { SettingsModule } from './settings/settings.module';


export const appRoutes: Routes = [
    {
        path: 'search/:corpus',
        component: SearchComponent,
        canActivate: [CorpusGuard, LoggedOnGuard],
    },
    {
        path: 'word-models/:corpus',
        component: WordModelsComponent,
        canActivate: [CorpusGuard, LoggedOnGuard],
    },
    {
        path: 'info/:corpus',
        component: CorpusInfoComponent,
        canActivate: [CorpusGuard, LoggedOnGuard]
    },
    {
        path: 'document/:corpus/:id',
        component: DocumentPageComponent,
        canActivate: [CorpusGuard, LoggedOnGuard],
    },
    {
        path: 'login',
        component: LoginComponent,
    },
    {
        path: 'login/:activated',
        component: LoginComponent,
    },
    {
        path: 'registration',
        component: RegistrationComponent,
    },
    {
        path: 'reset',
        component: RequestResetComponent,
    },
    {
        path: 'reset-password/:uid/:token',
        component: ResetPasswordComponent,
    },
    {
        path: 'privacy',
        component: PrivacyComponent,
    },
    {
        path: 'home',
        component: HomeComponent,
        canActivate: [LoggedOnGuard],
    },
    {
        path: 'manual/:identifier',
        component: ManualComponent,
    },
    {
        path: 'about',
        component: AboutComponent,
    },
    {
        path: 'search-history',
        component: SearchHistoryComponent,
    },
    {
        path: 'download-history',
        component: DownloadHistoryComponent,
    },
    {
        path: 'confirm-email/:key',
        component: VerifyEmailComponent,
    },
    {
        path: 'settings',
        component: SettingsComponent,
        canActivate: [LoggedOnGuard],
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
    },
];

export const declarations: any[] = [
    AppComponent,
    DialogComponent,
    FooterComponent,
    HomeComponent,
    MenuComponent,
    NotificationsComponent,
];


export const imports: any[] = [
    CorpusModule,
    CorpusSelectionModule,
    DialogModule,
    DocumentModule,
    HistoryModule,
    LoginModule,
    ManualModule,
    MenuModule,
    SearchModule,
    SettingsModule,
    SharedModule,
    WordModelsModule,
    RouterModule.forRoot(appRoutes, { relativeLinkResolution: 'legacy' }),
];

export const providers: any[] = [
    ApiService,
    ApiRetryService,
    ElasticSearchService,
    HighlightService,
    CorpusGuard,
    LoggedOnGuard,
    TitleCasePipe,
    CookieService,
    { provide: APP_BASE_HREF, useValue: '/' },
];

@NgModule({
    declarations,
    imports,
    providers,
    bootstrap: [AppComponent],
})
export class AppModule {}

