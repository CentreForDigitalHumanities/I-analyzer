import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiService } from '../../services';
import { AggregateTermFrequencyParams, Corpus, DateTermFrequencyParams } from '../../models';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'ia-full-data-button',
  templateUrl: './full-data-button.component.html',
  styleUrls: ['./full-data-button.component.scss']
})
export class FullDataButtonComponent {
    @Input() corpus: Corpus;
    @Input() visType: 'aggregate_term_frequency' | 'date_term_frequency';
    @Input() params: AggregateTermFrequencyParams | DateTermFrequencyParams;
    @Output() requestFullData = new EventEmitter<void>();

    isLoading = false; // show loading spinner in button
    showModal = false;

    faEnvelope = faEnvelope;

    constructor(private apiService: ApiService) { }

    onInitialRequest() {
        this.showLoading(
            this.checkFullDataAvailable().then(available => {
                if (available) {
                    this.onConfirm();
                } else {
                    this.showModal = true;
                }
            })
        );
    }

    async showLoading(promise: Promise<any>) {
        this.isLoading = true;
        await promise;
        this.isLoading = false;
    }

    checkFullDataAvailable(): Promise<boolean> {
        return this.apiService.fullDataInCache({
            corpus_name: this.corpus.name,
            visualization: this.visType,
            params: this.params
        } as any)
            .then(res => res.in_cache)
            .catch(err => {console.error(err); return false;});
    }

    onConfirm() {
        this.showModal = false;
        this.requestFullData.emit();
    }

}
