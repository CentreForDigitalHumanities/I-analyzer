import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { TermComparisonEditorComponent } from './barchart/term-comparison-editor/term-comparison-editor.component';
import { BarchartOptionsComponent } from './barchart/barchart-options.component';
import { HistogramComponent } from './barchart/histogram.component';
import { TimelineComponent } from './barchart/timeline.component';
import { FullDataButtonComponent } from './full-data-button/full-data-button.component';
import { NgramComponent } from './ngram/ngram.component';
import { JoyplotComponent } from './ngram/joyplot/joyplot.component';
import { VisualizationFooterComponent } from './visualization-footer/visualization-footer.component';
import { ApiService, DialogService, SearchService, VisualizationService } from '../services';
import { WordcloudComponent } from './wordcloud/wordcloud.component';
import { FreqtableComponent } from './freqtable.component';
import { VisualizationComponent } from './visualization.component';
import { HttpClientModule } from '@angular/common/http';
import { PaletteSelectComponent } from './visualization-footer/palette-select/palette-select.component';
import { TableModule } from 'primeng/table';
import { ChipsModule } from 'primeng/chips';
import { DropdownModule } from 'primeng/dropdown';
import { ChartModule } from 'primeng/chart';


@NgModule({
    providers: [
        ApiService,
        DialogService,
        SearchService,
        VisualizationService,
    ],
    declarations: [
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
    ],
    imports: [
        ChartModule,
        SharedModule,
        HttpClientModule,
        TableModule,
        ChipsModule,
        DropdownModule,
    ],
    exports: [
        TermComparisonEditorComponent,
        VisualizationFooterComponent,
        FreqtableComponent,
        VisualizationComponent,
    ]
})
export class VisualizationModule { }
