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

    public aggResults: {
        key: any,
        doc_count: number
    }[];

    constructor(private searchService: SearchService) {
    }

    ngOnInit() {
        this.setVisualizedField(this.corpus.visualize[0]);
    }

    setVisualizedField(visField: string) {
        this.visualizedField = visField;
        this.searchService.searchForVisualization(this.corpus, this.searchQuery, this.visualizedField).then(vis => {
            this.aggResults = vis.aggregations;
        });
    }
}
