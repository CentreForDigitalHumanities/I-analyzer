import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'ia-entity-legend',
  templateUrl: './entity-legend.component.html',
  styleUrls: ['./entity-legend.component.scss']
})
export class EntityLegendComponent implements OnInit {

  @Input() entities: string[];

  constructor() { }

  ngOnInit(): void {
  }

  formatClass(entityName: string): string {
    return `entity-${entityName.toLowerCase().slice(0,3)}`;
  }

}
