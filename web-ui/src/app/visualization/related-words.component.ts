import { Component, Input, OnChanges } from '@angular/core';

import { ManualService, SearchService } from '../services/index';
import { ExecSyncOptionsWithBufferEncoding } from 'child_process';
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
    @Input() queryText: string;
    @Input() corpusName: string;
    public zoomedInData; // data requested when clicking on a time interval
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
            }],
            xAxes: [],
        }
    }
    
    constructor(private manualService: ManualService, private searchService: SearchService) { }

    ngOnChanges() {
        this.searchData.datasets.map( (d, index) => {
            d.fill = false;
            d.borderColor = this.colorPalette[index];
        })
    }

    showRelatedWordsDocumentation() {
        this.manualService.showPage('relatedwords');
    }

    zoomTimeInterval(event) {
        this.searchService.getRelatedWordsTimeInterval(
            this.queryText, 
            this.corpusName,
            this.searchData.labels[event.element._index])
             .then(results => {
                this.zoomedInData = results['graphData'];
                this.zoomedInData.datasets
                 .sort((a, b) => { return b.data[0] - a.data[0] })
                 .map((d, index) => {
                    d.backgroundColor = this.colorPalette[index];
                })
                // hide grid lines as we only have one data point on x axis
                this.chartOptions.scales.xAxes.push({gridLines: {
                        display:false
                    }
                })
            })
    }

    zoomBack() {
        this.zoomedInData = null;
        this.chartOptions.scales.xAxes = [];
    }

}
