import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'ia-related-words',
    templateUrl: './related-words.component.html',
    styleUrls: ['./related-words.component.scss']
})
export class RelatedWordsComponent implements OnInit {
    @Input() searchData: any;
    private colorPalette = ['#a6611a','#dfc27d','#80cdc1','#018571','#543005','#bf812d','#f6e8c3','#f5f5f5','#c7eae5','#35978f','#003c30']
    private chartOptions = {
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
    constructor() { }

    ngOnInit() {
        console.log(this.searchData);
        this.searchData.datasets.map( (d, index) => {
            d.fill = false;
            d.borderColor = this.colorPalette[index];
        })
    }

}
