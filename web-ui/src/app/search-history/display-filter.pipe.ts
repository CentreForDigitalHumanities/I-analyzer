import { Pipe, PipeTransform } from '@angular/core';

import { SearchFilterData } from '../models/index'

@Pipe({name: 'displayFilter'})
export class DisplayFilterPipe implements PipeTransform {
  private returnHtml: string;

  transform(searchFilter: SearchFilterData): string {
  	let fieldName = Object.keys(searchFilter[Object.keys(searchFilter)[0]])[0];
  	let fieldNameDisplay = fieldName[0].toUpperCase() + fieldName.substring(1);
    switch (Object.keys(searchFilter)[0]) {
    	case 'term':
    		this.returnHtml = "<b>Boolean Filter:</b> " + fieldNameDisplay + ": " +
    		JSON.stringify(searchFilter[Object.keys(searchFilter)[0]][fieldName]);
    		return this.returnHtml;
    	case 'terms':
    		this.returnHtml = "<b>Multiple Choice Filter:</b> " + fieldNameDisplay + ", choices: " +
    		JSON.stringify(searchFilter[Object.keys(searchFilter)[0]][fieldName]);
    		return this.returnHtml;
    	case 'range':
    		this.returnHtml = "<b>Range Filter:</b> " + fieldNameDisplay + ": " + 
    		searchFilter[Object.keys(searchFilter)[0]][fieldName].gte + " - " +
    		searchFilter[Object.keys(searchFilter)[0]][fieldName].lte;
    		return this.returnHtml;
    }
  }

}