import { Component, ElementRef, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { View, ViewOptions, parse } from 'vega';

import { Corpus, CorpusField, GeoDocument, QueryModel } from '../../models';
import { VisualizationService } from '../../services';
import { showLoading } from '../../utils/utils';


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

  constructor(
    private visualizationService: VisualizationService,
    private el: ElementRef
  ) { }

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
          this.renderChart();
        })
        .catch(this.emitError.bind(this))
    );
  }

  getVegaSpec(): object {
    // Returns a Vega map specification
    // Uses pan/zoom signals from https://vega.github.io/vega/examples/zoomable-world-map/
    return {
      "$schema": "https://vega.github.io/schema/vega/v5.json",
      "description": "An interactive map supporting pan and zoom.",
      "width": 600,
      "height": 400,
      "autosize": "none",

      "signals": [
        { "name": "tx", "update": "width / 2" },
        { "name": "ty", "update": "height / 2" },
        {
          "name": "scale",
          "value": 500,
          "on": [{
            "events": {"type": "wheel", "consume": true},
            "update": "clamp(scale * pow(1.0005, -event.deltaY * pow(16, event.deltaMode)), 150, 3000)"
          }]
        },
        {
          "name": "angles",
          "value": [0, 0],
          "on": [{
            "events": "pointerdown",
            "update": "[rotateX, centerY]"
          }]
        },
        {
          "name": "cloned",
          "value": null,
          "on": [{
            "events": "pointerdown",
            "update": "copy('projection')"
          }]
        },
        {
          "name": "start",
          "value": null,
          "on": [{
            "events": "pointerdown",
            "update": "invert(cloned, xy())"
          }]
        },
        {
          "name": "drag", "value": null,
          "on": [{
            "events": "[pointerdown, window:pointerup] > window:pointermove",
            "update": "invert(cloned, xy())"
          }]
        },
        {
          "name": "delta", "value": null,
          "on": [{
            "events": {"signal": "drag"},
            "update": "[drag[0] - start[0], start[1] - drag[1]]"
          }]
        },
        {
          "name": "rotateX", "value": 0,
          "on": [{
            "events": {"signal": "delta"},
            "update": "angles[0] + delta[0]"
          }]
        },
        {
          "name": "centerY", "value": 35,
          "on": [{
            "events": {"signal": "delta"},
            "update": "clamp(angles[1] + delta[1], -60, 60)"
          }]
        }
      ],
    
      "projections": [
        {
          "name": "projection",
          "type": "mercator",
          "scale": {"signal": "scale"},
          "rotate": [{"signal": "rotateX"}, 0, 0],
          "center": [15, {"signal": "centerY"}],
          "translate": [{"signal": "tx"}, {"signal": "ty"}],
        }
      ],

      "data": [
        {
          "name": "world",
          "url": "https://unpkg.com/world-atlas@2/land-50m.json",
          "format": {"type": "topojson", "mesh": "land"}
        },
        {
          "name": "places",
          "format": {"type": "json"},
          "values": this.results
          }
      ],

      "marks": [
        {
          "type": "shape",
          "from": {"data": "world"},
          "encode": {
            "enter": {
              "strokeWidth": {"value": 0.75},
              "stroke": {"value": "#BDAE8A"},
              "fill": {"value": "#E5D3B3"}
            }
          },
          "transform": [
            {"type": "geoshape", "projection": "projection"}
          ]
        },
        {
          "type": "shape",
          "from": { "data": "places" },
          "encode": {
            "enter": {
              "width": 3,
              "height": 3,
              "fill": { "value": "red" },
            },
          },
          "transform": [
            {
              "type": "geoshape",
              "projection": "projection",
            }
          ]
        }
      ]
    };
  }


  renderChart(): Promise<View> {
    console.log('this.results length: ', this.results.length)
    const spec = this.getVegaSpec();
    const options: ViewOptions = {
        renderer:  'canvas',  // renderer (canvas or svg)
        container: '#vega-map',   // parent DOM container
        hover:     true       // enable hover processing
    };
    const view = new View(
        parse(spec),
        options
    );
    const width = this.el.nativeElement['offsetWidth'] * 0.9;
    const aspectRatio = spec['height'] / spec['width']  || 1;
    view.width(width);
    view.height(width * aspectRatio);
    return view.runAsync();
  }

  emitError(error: { message: string }) {
    this.mapError.emit(error?.message);
  }

}
