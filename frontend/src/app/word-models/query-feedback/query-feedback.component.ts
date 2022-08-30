import { Component, Input, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { QueryFeedback } from '../../models';

@Component({
  selector: 'ia-query-feedback',
  templateUrl: './query-feedback.component.html',
  styleUrls: ['./query-feedback.component.scss']
})
export class QueryFeedbackComponent implements OnInit {
    @Input() query: string;
    @Input() queryFeedback: QueryFeedback;

    titles = {
        'not in model': 'Query term not found',
        'error': 'Error',
    }

    constructor() { }

    ngOnInit(): void {
    }

    get suggestions(): string {
        if (this.queryFeedback?.similarTerms && this.queryFeedback?.similarTerms.length) {
            return _.join(this.queryFeedback.similarTerms, ', ');
        }
    }

}
