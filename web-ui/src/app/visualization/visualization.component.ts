import { Input, Component, OnInit, OnChanges } from '@angular/core';

import { Corpus, AggregateResults, SearchQuery } from '../models/index';
import { SearchService } from '../services/index';


@Component({
    selector: 'visualization',
    templateUrl: './visualization.component.html',
    styleUrls: ['./visualization.component.scss'],
})
export class VisualizationComponent implements OnInit {
    @Input() public searchQuery: SearchQuery;
    @Input() public corpus: Corpus;

    public visualizedField: string;
    public termFrequencyFields: string [];

    public aggResults: {
        key: any,
        doc_count: number
    }[];

    constructor(private searchService: SearchService) {
    }

    ngOnInit() {
        this.termFrequencyFields = this.corpus.fields.filter( field => field.termFrequency ).map( field => field.name );
        this.setVisualizedField(this.termFrequencyFields[0]);
    }

    setVisualizedField(visualizedField: string) {
        this.visualizedField = visualizedField;
        this.searchService.searchForVisualization(this.corpus, this.searchQuery, this.visualizedField).then(visual => {
            this.aggResults = visual.aggregations;
        });
    }
}
