import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Corpus } from '../models/corpus';
import { CorpusService } from '../services/index';
import { Router } from '@angular/router';

@Component({
    selector: 'home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
    public items: Corpus[];

    constructor(private router: Router, private corpusService: CorpusService, private title: Title) {
        this.title.setTitle('Home');
    }

    ngOnInit() {
        this.corpusService.get().then((items) => {
            this.items = items
        });
    }
}
