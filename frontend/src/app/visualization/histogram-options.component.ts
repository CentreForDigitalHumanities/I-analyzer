import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'ia-histogram-options',
    templateUrl: './histogram-options.component.html',
    styleUrls: ['./histogram-options.component.scss']
})
export class HistogramOptionsComponent implements OnInit {
    @Input() queryText: string;
    @Output() change = new EventEmitter();

    public frequencyMeasure: 'documents'|'tokens' = 'documents';
    public normalizer: 'raw'|'percent'|'documents'|'terms' = 'raw';

    constructor() { }

    ngOnInit(): void {
    }

    onChange(parameter: 'frequencyMeasure'|'normalizer'): void {
        if (parameter === 'frequencyMeasure') {
            this.normalizer = 'raw';
        }

        this.change.emit({
            frequencyMeasure: this.frequencyMeasure,
            normalizer: this.normalizer,
        });
    }

}
