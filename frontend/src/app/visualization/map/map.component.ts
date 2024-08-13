import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { Corpus, CorpusField, GeoDocument, QueryModel } from '@models';
import { VisualizationService } from '@services';
import { showLoading } from '@utils/utils';


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

  @Output() mapError = new EventEmitter();

  results: GeoDocument[];

  isLoading$ = new BehaviorSubject<boolean>(false);

  constructor(private visualizationService: VisualizationService) { }

  get readyToLoad() {
    return (
      this.corpus &&
      this.visualizedField &&
      this.queryModel
    );
  }

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
      // this.makeChart();
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
        )
        .then(geoData => {
          this.results = geoData;
        })
        .catch(this.emitError.bind(this))
    );
  }

  makeChart(geoData: GeoDocument[]) {
  }


  emitError(error: { message: string }) {
    this.mapError.emit(error?.message);
  }

}
