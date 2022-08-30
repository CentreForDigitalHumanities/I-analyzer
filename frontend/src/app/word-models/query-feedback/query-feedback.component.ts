import { Component, Input, OnInit } from '@angular/core';
import { QueryFeedback } from '../../models';

@Component({
  selector: 'ia-query-feedback',
  templateUrl: './query-feedback.component.html',
  styleUrls: ['./query-feedback.component.scss']
})
export class QueryFeedbackComponent implements OnInit {
    @Input() query: string;
    @Input() queryFeedback: QueryFeedback;

    constructor() { }

    ngOnInit(): void {
    }

}
