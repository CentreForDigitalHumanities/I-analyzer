import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import * as _ from 'lodash';
import { QueryFeedback } from '../../models';

@Component({
  selector: 'ia-query-feedback',
  templateUrl: './query-feedback.component.html',
  styleUrls: ['./query-feedback.component.scss']
})
export class QueryFeedbackComponent {
    @Input() query: string;
    @Input() queryFeedback: QueryFeedback;

    @Output() selectedSuggestion = new EventEmitter<string>();

    titles = {
        'not in model': 'Query term not found',
        'error': 'Error',
        'multiple words': 'Multiple words not allowed',
        'empty': 'No query'
    };

    constructor() { }

    isFinalTerm(term) {
        if (this.queryFeedback.similarTerms && this.queryFeedback.similarTerms.length) {
            return term === _.last(this.queryFeedback.similarTerms);
        }
    }

    submitNewQuery(term) {
        this.selectedSuggestion.emit(term);
    }

}
