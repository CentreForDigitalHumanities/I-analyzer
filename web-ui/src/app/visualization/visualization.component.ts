import { Input, Component, OnInit, OnChanges } from '@angular/core';

import { Corpus } from '../models/index';

@Component({
  selector: 'visualization',
  templateUrl: './visualization.component.html',
  styleUrls: ['./visualization.component.scss'],
})
export class VisualizationComponent implements OnInit, OnChanges {
  @Input() public searchData: Array<any>;
  @Input() public corpus: Corpus;

  public countKey: string;

  constructor() {
      this.countKey = 'category';
    }

 
  ngOnInit() {	    	
  }

  ngOnChanges() {
    console.log(this.searchData);		      
  }	

}