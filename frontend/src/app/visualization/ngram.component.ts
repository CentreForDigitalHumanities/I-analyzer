import { Component, Input, OnChanges, OnInit } from '@angular/core';

@Component({
    selector: 'ia-ngram',
    templateUrl: './ngram.component.html',
    styleUrls: ['./ngram.component.scss']
})
export class NgramComponent implements OnInit, OnChanges {
    @Input() searchData: {
        labels: string[],
        datasets: {
            label: string,
            data: number[],
            backgroundColor?: string,
            borderColor?: string,
            pointRadius?: number,
            pointHoverRadius?: number,
        }[]
    };

    public colorPalette = ['#88CCEE', '#44AA99', '#117733', '#332288', '#DDCC77', '#999933', '#CC6677', '#882255', '#AA4499', '#DDDDDD'];
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
                    labelString: 'Frequency'
                }
            }],
            xAxes: [],
        },
        tooltips: {
            intersect: false,
            callbacks: {
                labelColor(tooltipItem, chart): any {
                    const dataset = chart.data.datasets[tooltipItem.datasetIndex];
                    const color = dataset.borderColor;
                    return {
                        borderColor: 'rba(0,0,0,0)',
                        backgroundColor: color
                    };
                },
                label(tooltipItem, data): string {
                    const dataset = data.datasets[tooltipItem.datasetIndex];
                    const label = dataset.label;
                    const value: any = dataset.data[tooltipItem.index];
                    if (value) { // skip 0 values
                        return `${label}: ${Math.round((value) * 10000) / 10000}`;
                    }
                  },
            }
        }
    };

    constructor() { }

    ngOnInit(): void { }

    ngOnChanges(): void {
        this.searchData.datasets.forEach((data, index) => {
            data.borderColor = this.colorPalette[index];
            data.backgroundColor = 'rgba(0,0,0,0)';
            data.pointRadius = 0;
            data.pointHoverRadius = 0;
        });
    }

}
