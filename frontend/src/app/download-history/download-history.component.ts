import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services';

@Component({
    selector: 'ia-download-history',
    templateUrl: './download-history.component.html',
    styleUrls: ['./download-history.component.scss']
})
export class DownloadHistoryComponent implements OnInit {

    constructor(private apiService: ApiService) { }

    ngOnInit(): void {
        this.apiService
    }

}
