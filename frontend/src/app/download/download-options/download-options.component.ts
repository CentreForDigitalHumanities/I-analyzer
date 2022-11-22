import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Download, PendingDownload, DownloadOptions } from '../../models';

@Component({
    selector: 'ia-download-options',
    templateUrl: './download-options.component.html',
    styleUrls: ['./download-options.component.scss']
})
export class DownloadOptionsComponent implements OnInit {
    @Input() download: Download | PendingDownload;

    @Output() confirm = new EventEmitter<DownloadOptions>();
    @Output() cancel = new EventEmitter();

    encodingOptions = [ 'utf-8', 'utf-16'];
    encoding: 'utf-8'|'utf-16' = 'utf-8';

    constructor() { }

    ngOnInit(): void {
    }

    confirmDownload() {
        this.confirm.emit({
            encoding: this.encoding,
        })
    }

    cancelDownload() {
        this.cancel.emit();
    }

}
