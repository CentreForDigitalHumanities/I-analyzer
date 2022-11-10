import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Download } from '../../models';

@Component({
    selector: 'ia-download-options',
    templateUrl: './download-options.component.html',
    styleUrls: ['./download-options.component.scss']
})
export class DownloadOptionsComponent implements OnInit {
    @Input() download: Download;

    @Output() cancel = new EventEmitter();

    encodingOptions = [ 'utf-8', 'utf-16'];
    encoding: 'utf-8'|'utf-16' = 'utf-8';

    constructor() { }

    ngOnInit(): void {
    }

    downloadLink(download: Download): string {
        if (download) {
            return '/api/csv/' + download.filename;
        }
    }

    cancelDownload() {
        this.cancel.emit();
    }

}
