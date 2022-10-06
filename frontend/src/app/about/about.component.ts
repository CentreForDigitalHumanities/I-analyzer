import { Component, OnInit } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { environment } from '../../environments/environment';
import { DialogService } from '../services';

@Component({
  selector: 'ia-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
    public appName: string;
    public aboutHtml: SafeHtml;

    constructor(private dialogService: DialogService) { }

    ngOnInit() {
        this.appName = environment.appName;
        this.fetchData();
    }

    async fetchData() {
        this.aboutHtml = await this.dialogService.getAboutPage(environment.aboutPage);
    }

}
