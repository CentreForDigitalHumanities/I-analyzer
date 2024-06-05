import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs';
import { Corpus } from '../models/corpus';
import { CorpusService } from '../services/index';
import { showLoading } from '../utils/utils';
import { environment } from '../../environments/environment';

@Component({
    selector: 'ia-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
    public items: Corpus[];

    isLoading = new BehaviorSubject<boolean>(false);

    constructor(private corpusService: CorpusService, title: Title) {
        title.setTitle(environment.appName);
    }

    ngOnInit() {
        showLoading(
            this.isLoading,
            this.corpusService.get(true).then((items) => (this.items = items))
        );
    }
}
