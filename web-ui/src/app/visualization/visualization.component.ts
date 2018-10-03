import { ElementRef, Input, Component, OnDestroy, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { Subscription }   from 'rxjs';
import { SelectItem, SelectItemGroup } from 'primeng/api';
import { Corpus, AggregateResult, AggregateData, QueryModel } from '../models/index';
import { SearchService, ApiService, DataService } from '../services/index';

@Component({
    selector: 'visualization',
    templateUrl: './visualization.component.html',
    styleUrls: ['./visualization.component.scss'],
})
export class VisualizationComponent implements OnChanges {
    @ViewChild('chart') private chartContainer: ElementRef;

    @Input() public queryModel: QueryModel;
    @Input() public corpus: Corpus;
    @Input() public contents: string[];
    @Input() public visualizedFields: {
        name: string;
        displayName: string;
    }[];

    public asPercentage: boolean;

    public showTableButtons: boolean;

    public visualizedField: string;

    public visDropdown: SelectItem[];
    public groupedVisualizations: SelectItemGroup[];
    public visualizationType: string;
    public freqtable: boolean = false;

    public chartElement: any;
    public aggResults: AggregateResult[];

    public subscription: Subscription;
    public aggregateData: AggregateData;

    constructor(private dataService: DataService, private apiService: ApiService) {
        this.subscription = this.dataService.visualizationData$.subscribe(
            data => {
                if (data !== {}) {
                    console.log(JSON.stringify(Object.keys(data)));
                    this.aggregateData = data;
                    if (this.visualizedField !== undefined) {
                        this.setVisualizedField(this.visualizedField);
                    }
                    else {
                        //
                    }
                }
        });
    }

    ngOnInit() {
        // Initial values
        this.showTableButtons = true;
        this.chartElement = this.chartContainer.nativeElement;
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    ngOnChanges(changes: SimpleChanges) {
        //this.visualizedField = this.visualizedField? this.visualizedField : this.visualizedFields[0].name;
        //SelectItem representations of visualized fields
        this.visDropdown =
            this.visualizedFields.map(field => ({
                label: field.displayName,
                value: {
                    field: field.name
                }
            }))

        //Grouped visualizations. Keeping this here for future use.
        // this.groupedVisualizations = [
        //     {
        //         label: 'Histograms',
        //         items: this.visualizedFields.map(field => ({
        //             label: field.displayName,
        //             value: {
        //                 field: field.name
        //             }
        //         }))
        //     }
        // ]
    }

    setVisualizedField(visualizedField: string) {
        let visualizationType = this.corpus.fields.find(field => field.name === visualizedField).visualizationType;
        // if (visualizationType === 'wordcloud') {
        //     this.apiService.getWordcloudData({ 'content_list': this.contents }).then(result => {
        //         this.visualizedField = visualizedField;
        //         this.visualizationType = visualizationType;
        //         this.aggResults = result['data'];
        //     });
        // }
        // else if (visualizationType == 'timeline') {
        //     let aggregator = [{name: visualizedField, size: 10000}];
        //     this.searchService.aggregateSearch(this.corpus, this.queryModel, aggregator).then(visual => {
        //         this.visualizedField = visualizedField;
        //         this.visualizationType = visualizationType;
        //         this.aggResults = visual.aggregations[visualizedField].slice(0);
        //     });
        // }
        // else {
            //this.aggResults = this.aggregateData[visualizedField];
            this.visualizedField = visualizedField;
            this.visualizationType = visualizationType;
            this.aggResults = this.aggregateData[visualizedField].slice(0); 
        //}
    }

    showTable() {
        this.freqtable = true;
    }

    showChart() {
        this.freqtable = false;
        this.setVisualizedField(this.visualizedField);
    }
}