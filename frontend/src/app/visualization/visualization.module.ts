import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { ChipsModule } from 'primeng/chips';
import { DropdownModule } from 'primeng/dropdown';
import {
    ApiService,
    DialogService,
    SearchService,
    VisualizationService,
} from '@services';
import { SharedModule } from '@shared/shared.module';
import { BarchartOptionsComponent } from './barchart/barchart-options.component';
import { HistogramComponent } from './barchart/histogram.component';
import { TermComparisonEditorComponent } from './barchart/term-comparison-editor/term-comparison-editor.component';
import { TimelineComponent } from './barchart/timeline.component';
import { FreqtableComponent } from './freqtable.component';
import { FullDataButtonComponent } from './full-data-button/full-data-button.component';
import { JoyplotComponent } from './ngram/joyplot/joyplot.component';
import { NgramComponent } from './ngram/ngram.component';
import { PaletteSelectComponent } from './visualization-footer/palette-select/palette-select.component';
import { VisualizationFooterComponent } from './visualization-footer/visualization-footer.component';
import { VisualizationComponent } from './visualization.component';
import { WordcloudComponent } from './wordcloud/wordcloud.component';
import { MapComponent } from './map/map.component';


@NgModule({ declarations: [
        TermComparisonEditorComponent,
        BarchartOptionsComponent,
        HistogramComponent,
        TimelineComponent,
        FullDataButtonComponent,
        JoyplotComponent,
        NgramComponent,
        VisualizationFooterComponent,
        WordcloudComponent,
        FreqtableComponent,
        VisualizationComponent,
        PaletteSelectComponent,
        MapComponent,
    ],
    exports: [
        TermComparisonEditorComponent,
        VisualizationFooterComponent,
        FreqtableComponent,
        VisualizationComponent,
    ], imports: [ChartModule,
        SharedModule,
        ChipsModule,
        DropdownModule], providers: [ApiService, DialogService, SearchService, VisualizationService, provideHttpClient(withInterceptorsFromDi())] })
export class VisualizationModule {}
