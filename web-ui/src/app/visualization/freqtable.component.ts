import { Input, Component, OnChanges, ElementRef, ViewEncapsulation, SimpleChanges } from '@angular/core';

import * as d3 from 'd3';
import * as _ from "lodash";

@Component({
  selector: 'ia-freqtable',
  templateUrl: './freqtable.component.html',
  styleUrls: ['./freqtable.component.scss']
})
export class FreqtableComponent implements OnInit {
  @Input('searchData')
  public searchData: {
    key: any,
    doc_count: number,
    key_as_string?: string
  }[];
  @Input() public visualizedField;
  @Input() public chartElement;

  constructor() { }

  ngOnInit() {
  }

}
