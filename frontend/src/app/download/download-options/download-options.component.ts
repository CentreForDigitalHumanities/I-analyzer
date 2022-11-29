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

    format: 'long'|'wide';

    constructor() { }

    get showFormatChoice() {
        const termFrequencyTypes =  ['aggregate_term_frequency', 'date_term_frequency'];
        const isTermFrequency = termFrequencyTypes.includes(this.download?.download_type);

        if (isTermFrequency) {
            const parameterString = (this.download as Download).parameters || '[]';
            const parameters = JSON.parse(parameterString);
            return parameters.length > 1;
        }
    }

    ngOnInit(): void {
    }

    confirmDownload() {
        this.confirm.emit({
            encoding: this.encoding,
            format: this.format,
        });
    }

    cancelDownload() {
        this.cancel.emit();
    }


}
