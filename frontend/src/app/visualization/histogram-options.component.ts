import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { histogramOptions } from '../models';

@Component({
    selector: 'ia-histogram-options',
    templateUrl: './histogram-options.component.html',
    styleUrls: ['./histogram-options.component.scss']
})
export class HistogramOptionsComponent implements OnInit {
    @Input() queryText: string;
    @Input() showTokenCountOption: boolean;
    @Output() options = new EventEmitter<histogramOptions>();

    public frequencyMeasure: 'documents'|'tokens' = 'documents';
    public normalizer: 'raw'|'percent'|'documents'|'terms' = 'raw';

    constructor() { }

    ngOnInit(): void {
    }

    onChange(parameter: 'frequencyMeasure'|'normalizer'): void {
        if (parameter === 'frequencyMeasure') {
            this.normalizer = 'raw';
        }

        this.options.emit({
            frequencyMeasure: this.frequencyMeasure,
            normalizer: this.normalizer,
        });
    }

}
