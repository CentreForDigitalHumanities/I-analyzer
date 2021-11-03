import { Component, Input, OnChanges, OnInit } from '@angular/core';

@Component({
    selector: 'ia-collocation',
    templateUrl: './collocation.component.html',
    styleUrls: ['./collocation.component.scss']
})
export class CollocationComponent implements OnInit, OnChanges {
    @Input() searchData: {
        labels: string[],
        datasets: {
            label: string,
            data: number[],
            backgroundColor?: string,
            borderColor?: string,
            pointRadius?: number;
        }[]
    };

    public colorPalette = ['#a6611a', '#dfc27d', '#80cdc1', '#018571', '#543005', '#bf812d', '#f6e8c3', '#c7eae5', '#35978f', '#003c30'];
    public chartOptions = {
        elements: {
            line: {
                tension: 0, // disables bezier curves
            }
        },
        scales: {
            yAxes: [{
                stacked: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Frequency'
                }
            }],
            xAxes: [],
        },
        tooltips: {
            intersect: false,
            callbacks: {
                label(tooltipItem, data): string {
                    const dataset = data.datasets[tooltipItem.datasetIndex];
                    const label = dataset.label;
                    const value: any = dataset.data[tooltipItem.index];
                    if (value) { // skip 0 values
                        return `${label}: ${value}`;
                    }
                  },
            }
        }
    };

    constructor() { }

    ngOnInit(): void { }

    ngOnChanges(): void {
        this.searchData.datasets.forEach((data, index) => {
            data.backgroundColor = this.colorPalette[index];
            data.borderColor = 'rgba(0,0,0,0)';
            data.pointRadius = 0;
        });
    }

}
