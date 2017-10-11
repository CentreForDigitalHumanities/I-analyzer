import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';

import { CalendarModule, SelectButtonModule, SliderModule } from 'primeng/primeng';

import { ApiService, ConfigService, CorpusService, SearchService, UserService } from './services/index';

import { AppComponent } from './app.component';
import { CorpusListComponent } from './corpus-list/corpus-list.component';
import { HomeComponent } from './home/home.component';
import { SearchComponent, SearchFilterComponent, SearchSampleComponent } from './search/index';
import { MenuComponent } from './menu/menu.component';
import { LoggedOnGuard } from './logged-on.guard';
import { LoginComponent } from './login/login.component';
import { ScrollToDirective } from './scroll-to.directive';
import { VisualizationComponent } from './visualization/visualization.component';

const appRoutes: Routes = [
    {
        path: 'search/:corpus',
        component: SearchComponent,
        canActivate: [LoggedOnGuard]
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'home',
        component: HomeComponent,
        canActivate: [LoggedOnGuard]
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    {
        path: 'visual',
        component: VisualizationComponent
    }
]
@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        CorpusListComponent,
        SearchComponent,
        SearchFilterComponent,
        SearchSampleComponent,
        MenuComponent,
        LoginComponent,
        ScrollToDirective,
        VisualizationComponent
    ],
    imports: [
        BrowserAnimationsModule,
        BrowserModule,
        CalendarModule,
        CommonModule,
        FormsModule,
        HttpModule,
        RouterModule.forRoot(appRoutes),
        SelectButtonModule,
        SliderModule
    ],
    providers: [ApiService, CorpusService, ConfigService, SearchService, UserService, LoggedOnGuard],
    bootstrap: [AppComponent]
})
export class AppModule { }
