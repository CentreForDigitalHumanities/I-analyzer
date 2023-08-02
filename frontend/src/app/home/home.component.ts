import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs';
import { Corpus } from '../models/corpus';
import { CorpusService } from '../services/index';
import { showLoading } from '../utils/utils';

@Component({
    selector: 'home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
    public items: Corpus[];

    isLoading = new BehaviorSubject<boolean>(false);

    constructor(private corpusService: CorpusService, private title: Title) {
        this.title.setTitle('Home');
    }

    ngOnInit() {
        showLoading(
            this.isLoading,
            this.corpusService.get(true)
            .then((items) => this.items = items)
        );
    }

}
