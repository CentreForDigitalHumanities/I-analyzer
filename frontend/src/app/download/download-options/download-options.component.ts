import { Component, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { Download, PendingDownload, DownloadOptions } from '../../models';

@Component({
    selector: 'ia-download-options',
    templateUrl: './download-options.component.html',
    styleUrls: ['./download-options.component.scss']
})
export class DownloadOptionsComponent implements OnChanges {
    @Input() download: Download | PendingDownload;

    @Output() confirm = new EventEmitter<DownloadOptions>();
    @Output() cancel = new EventEmitter();

    encodingOptions = [ 'utf-8', 'utf-16'];
    encoding: 'utf-8'|'utf-16' = 'utf-8';

    format: 'long'|'wide';

    hasConfirmed = false;

    constructor() {
        this.confirm.subscribe(() => this.hasConfirmed = true);
    }

    /** whether the current download is a term frequency download */
    get isTermFrequency(): boolean {
        const termFrequencyTypes =  ['aggregate_term_frequency', 'date_term_frequency'];
        return termFrequencyTypes.includes(this.download?.download_type);
    }

    /** whether to display long/wide format choice */
    get showFormatChoice(): boolean {
        if (this.isTermFrequency) {
            const parameterString = (this.download as Download).parameters || '[]';
            const parameters = JSON.parse(parameterString);
            return parameters.length > 1;
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.isTermFrequency) {
            this.format = 'long';
        }
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
