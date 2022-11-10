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

    constructor() { }

    ngOnInit(): void {
    }

    downloadLink(download: Download): string {
            return '/api/csv/' + download.filename;
        }
    }

    cancelDownload() {
        this.cancel.emit();
    }

}
