import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { pageTitle } from '@utils/app';

@Component({
    selector: 'ia-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
    standalone: false
})
export class SettingsComponent implements OnInit {

    constructor(private title: Title) { }

    ngOnInit(): void {
        this.title.setTitle(pageTitle('Settings'));
    }

}
