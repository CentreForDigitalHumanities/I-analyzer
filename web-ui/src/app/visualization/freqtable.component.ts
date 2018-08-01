import { Input, Component, OnInit, OnChanges, ElementRef, ViewEncapsulation, SimpleChanges } from '@angular/core';
import { TitleCasePipe } from '@angular/common';

import * as d3 from 'd3';
import * as _ from "lodash";
import { TableBody } from '../../../node_modules/primeng/primeng';

@Component({
  selector: 'ia-freqtable',
  templateUrl: './freqtable.component.html',
  styleUrls: ['./freqtable.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class FreqtableComponent implements OnChanges {
  @Input('searchData')
  public searchData: {
    key: any,
    doc_count: number,
    key_as_string?: string
  }[];
  @Input() public visualizedField;
  @Input() public chartElement;
  @Input() public asPercent: boolean = true;

  constructor(private titlecasepipe: TitleCasePipe) { }

  ngOnChanges(changes: SimpleChanges) {

    if (this.searchData && this.visualizedField) {
      // date fields are returned with keys containing identifiers by elasticsearch
      // replace with string representation, contained in 'key_as_string' field
      if ('key_as_string' in this.searchData[0]) {
        this.searchData.forEach(cat => cat.key = cat.key_as_string)
      }
      this.createTable();
      // if (changes['visualizedField'] != undefined) {
      //   this.createTable(changes['visualizedField'].previousValue != changes['visualizedField'].currentValue);
      // }
    }
  }

  /**
   * Creates the chart to draw the data on (including axes and labels).
   */
  createTable() {
    /**
    * select DOM elements, set up scales and axes
    */
    if (this.asPercent) {
      console.log(this.searchData);
    }

    d3.selectAll('svg').remove();


    //   this.svg = d3.select(this.chartElement).append('div')
    //     .attr("id", "table-div")
    //     .attr('width', this.chartElement.offsetWidth)
    //     .attr('height', this.chartElement.offsetHeight);
    //   this.width = this.chartElement.offsetWidth - this.margin.left - this.margin.right;
    //   this.height = this.chartElement.offsetHeight - this.margin.top - this.margin.bottom;



    //   this.table = d3.select("#table-div").append("table")
    //     .attr("class", "table table-hover")
    //   this.header = this.table.append('thead').append('tr')

    //   var rowsArray = [];

    //   for (var field of this.searchData) {
    //     if (field.key_as_string != undefined) {
    //       rowsArray.push([field.key_as_string, field.doc_count]);
    //     }
    //     else {
    //       rowsArray.push([field.key, field.doc_count]);
    //     }
    //   }

    //   this.header
    //     .selectAll('th')
    //     .data([this.titlecasepipe.transform(this.visualizedField), 'Frequency'])
    //     .enter()
    //     .append('th')
    //     .text(function (d) { return d })

    //   this.tablebody = this.table.append("tbody");
    //   this.rows = this.tablebody
    //     .selectAll("tr")
    //     .data(rowsArray)
    //     .enter()
    //     .append("tr");

    //   this.cells = this.rows.selectAll("td")
    //     // each row has data associated; we get it and enter it for the cells.
    //     .data(function (d) {
    //       // console.log(d);
    //       return d;
    //     })
    //     .enter()
    //     .append("td")
    //     .text(function (d) {
    //       return d;
    //     });
    // }
  }
}


type KeyFrequencyPair = {
  key: string;
  doc_count: number;
  key_as_string?: string;
}
