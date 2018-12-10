import { Component, Input, OnChanges } from '@angular/core';

import { ManualService } from '../services/index';
@Component({
    selector: 'ia-related-words',
    templateUrl: './related-words.component.html',
    styleUrls: ['./related-words.component.scss']
})
export class RelatedWordsComponent implements OnChanges {
    @Input() searchData: {
        labels: string[],
        datasets: {
            label: string,
            data: number[],
            fill?: boolean,
            borderColor?: string
        }[]
    };
    // colour-blind friendly colorPalette retrieved from colorbrewer2.org
    public colorPalette = ['#a6611a','#dfc27d','#80cdc1','#018571','#543005','#bf812d','#f6e8c3','#f5f5f5','#c7eae5','#35978f','#003c30']
    public chartOptions = {
        elements: {
            line: {
                tension: 0, // disables bezier curves
            }
        }, 
        scales: {
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'Cosine similarity (SVD_PPMI)'
                }
            }]
        }
    }
    
    constructor(private manualService: ManualService) { }

    ngOnChanges() {
        this.searchData.datasets.map( (d, index) => {
            d.fill = false;
            d.borderColor = this.colorPalette[index];
        })
    }

    showRelatedWordsDocumentation() {
        this.manualService.showPage('relatedwords');
    }

}
