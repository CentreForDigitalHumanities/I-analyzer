import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'ia-collocation',
    templateUrl: './collocation.component.html',
    styleUrls: ['./collocation.component.scss']
})
export class CollocationComponent implements OnInit {
    @Input() searchData: {
        labels: string[],
        datasets: {
            label: string,
            data: number[],
            fill?: boolean,
            backgroundColor?: string,
            borderColor?: string
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
                // stacked: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Frequency'
                }
            }],
            xAxes: [],
        },
        tooltips: {
            intersect: false,
        }
    };

    constructor() { }

    ngOnInit(): void {
        this.searchData.datasets.forEach((data, index) => {
            data.fill = false;
            data.backgroundColor = this.colorPalette[index]; // set background color for tooltip
            data.borderColor = this.colorPalette[index];
        });
        console.log(this.searchData);
    }

}
