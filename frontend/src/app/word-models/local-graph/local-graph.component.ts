import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Corpus } from '@models';
import { WordmodelsService } from '@services';

@Component({
    selector: 'ia-local-graph',
    templateUrl: './local-graph.component.html',
    styleUrl: './local-graph.component.scss'
})
export class LocalGraphComponent implements OnChanges {
    @Input({required: true}) corpus!: Corpus;
    @Input({required: true}) queryText!: string;

    data: any;

    constructor(
        private wordModelsService: WordmodelsService,
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        this.getData()
    }

    getData() {
        this.wordModelsService.getLocalGraph(
            this.queryText, this.corpus.name, 5
        ).subscribe(res => this.data = res);
    }
}
