import { Component, OnInit } from '@angular/core';
import { Download } from '../models';
import { ApiService } from '../services';

@Component({
    selector: 'ia-download-history',
    templateUrl: './download-history.component.html',
    styleUrls: ['./download-history.component.scss']
})
export class DownloadHistoryComponent implements OnInit {
    downloads: Download[];

    constructor(private apiService: ApiService) { }

    ngOnInit(): void {
        this.apiService.downloads()
            .then(result => this.downloads = result)
            .catch(err => console.error(err));
    }

}
