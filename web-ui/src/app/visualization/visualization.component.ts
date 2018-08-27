import { ElementRef, Input, Component, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { SelectItem, SelectItemGroup } from 'primeng/api';
import { Corpus, AggregateResults, FoundDocument, QueryModel } from '../models/index';
import { SearchService, ApiService } from '../services/index';



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

    public asPercentage: boolean;

    public showTableButtons: boolean;

    public visualizedField: string;
    public significantText: any[];

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

    constructor(private searchService: SearchService, private apiService: ApiService) {

    }

    ngOnInit() {
        // Initial values 
        this.showTableButtons = true;
        this.chartElement = this.chartContainer.nativeElement;
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

        if (this.visualizedFields.length) {
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
        this.visualizationType = this.corpus.fields.find(field => field.name == visualizedField).visualizationType;
        if (this.visualizationType == 'wordcloud') {
            this.apiService.getWordcloudData({'content_list': this.contents}).then( result => {
            this.visualizedField = visualizedField;
            this.significantText = result['data'];
        });
        }
        else {
            this.searchService.searchForVisualization(this.corpus, this.queryModel, visualizedField).then(visual => {
                this.visualizedField = visualizedField;
                this.aggResults = visual.aggregations;
                console.log(this.aggResults);
            });
        };
    }

    showWordcloud() {
        this.apiService.getWordcloudData({'content_list': this.contents}).then( result => {
            this.significantText = result['data'];
        });
    }
    
    showTable() {
        this.freqtable = true;
    }

    showChart() {
        this.freqtable = false;
        this.setVisualizedField(this.visualizedField);
    }
}

type AggregateResult = {
    key: any,
    doc_count: number
}
