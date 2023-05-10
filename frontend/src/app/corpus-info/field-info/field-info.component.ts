import { Component, Input, OnInit } from '@angular/core';
import { CorpusField } from '../../models';

@Component({
  selector: 'ia-field-info',
  templateUrl: './field-info.component.html',
  styleUrls: ['./field-info.component.scss']
})
export class FieldInfoComponent implements OnInit {
    @Input() field: CorpusField;

    constructor() { }

    ngOnInit(): void {
    }

}
