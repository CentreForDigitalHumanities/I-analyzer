import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Corpus, CorpusField, QueryModel } from '../../models';
import { VisualizationService } from 'src/app/services';

@Component({
  selector: 'ia-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnChanges {

  @Input() visualizedField: CorpusField;
  @Input() queryModel: QueryModel;
  @Input() corpus: Corpus;
  @Input() resultsCount: number;
  @Input() asTable: boolean;

  constructor(private visualizationService: VisualizationService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (
        this.readyToLoad &&
        (changes.corpus || changes.visualizedField || changes.queryModel)
    ) {
        if (changes.queryModel) {
            this.queryModel.update.subscribe(this.loadData.bind(this));
        }
        this.loadData();
    } else {
        this.makeChart();
    }
}

loadData() {
  showLoading(
      this.isLoading$,
      this.visualizationService
          .getGeoData(
              this.visualizedField.name,
              this.queryModel,
              this.corpus,
              this.resultsCount
          )
          .then(this.onDataLoaded.bind(this))
          .catch(this.emitError.bind(this))
  );
}

makeChart() {}

}
