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
    //@Input() public aggregateData: AggregateData;

    public asPercentage: boolean;

    public showTableButtons: boolean;

    public visualizedField: string;

    public visDropdown: SelectItem[];
    public groupedVisualizations: SelectItemGroup[];
    public visualizedFields: {
        name: string;
        displayName: string;
    }[];
    public visualizationType: string;
    public freqtable: boolean = false;

    public chartElement: any;
    public aggResults: AggregateResult[];

    public subscription: Subscription;
    public aggregateData: AggregateData;

    constructor(private searchService: SearchService, private dataService: DataService, private apiService: ApiService) {
        this.subscription = this.dataService.searchData$.subscribe(
            data => {
                this.aggregateData = data;
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
        this.visualizedFields = this.corpus && this.corpus.fields
            ? this.corpus.fields.filter(field => field.visualizationType != undefined).map(field =>
                (field.displayName != undefined) ?
                    ({
                        name: field.name,
                        displayName: field.displayName
                    }) :
                    // in case display name is not provided in the corpus definition
                    ({
                        name: field.name,
                        displayName: field.name
                    })

            )
            : [];

        if (!this.visualizedField) {
            this.setVisualizedField(this.visualizedFields[0].name);
        }

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
        let visualizationType = this.corpus.fields.find(field => field.name == visualizedField).visualizationType;
        if (visualizationType == 'wordcloud') {
            this.apiService.getWordcloudData({ 'content_list': this.contents }).then(result => {
                this.visualizedField = visualizedField;
                this.visualizationType = visualizationType;
                this.aggResults = result['data'];
            });
        }
        else if (visualizationType == 'timeline') {
            let aggregator = [{name: visualizedField, size: 10000}];
            this.searchService.aggregateSearch(this.corpus, this.queryModel, aggregator).then(visual => {
                this.visualizedField = visualizedField;
                this.visualizationType = visualizationType;
                this.aggResults = visual.aggregations[visualizedField];
            });
        }
        else {
            console.log(this.aggregateData);
            this.aggResults = this.aggregateData[visualizedField];
            // this.searchService.aggregateSearch(this.corpus, this.queryModel, visualizedField, 10000).then(visual => {
            //     this.visualizedField = visualizedField;
            //     this.visualizationType = visualizationType;
            //     this.aggResults = visual.aggregations;
            // });
        }
    }

    showTable() {
        this.freqtable = true;
    }

    showChart() {
        this.freqtable = false;
        this.setVisualizedField(this.visualizedField);
    }
}