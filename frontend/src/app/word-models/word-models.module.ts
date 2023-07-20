import { NgModule } from '@angular/core';
import { SharedModule } from 'primeng/api';
import { WordModelsComponent } from './word-models.component';
import { VisualizationModule } from '../visualization/visualization.module';
import { QueryFeedbackComponent } from './query-feedback/query-feedback.component';
import { RelatedWordsComponent } from './related-words/related-words.component';
import { WordSimilarityComponent } from './word-similarity/word-similarity.component';
import { SimilarityChartComponent } from './similarity-chart/similarity-chart.component';
import { WordmodelsService } from '../services';
import { RouterModule } from '@angular/router';
import { TimeIntervalSliderComponent } from './similarity-chart/time-interval-slider/time-interval-slider.component';


@NgModule({
    providers: [
        WordmodelsService,
    ],
    declarations: [
        WordModelsComponent,
        QueryFeedbackComponent,
        RelatedWordsComponent,
        WordSimilarityComponent,
        SimilarityChartComponent,
        TimeIntervalSliderComponent,
    ], exports: [
        WordModelsComponent,
    ],
    imports: [
        SharedModule,
        RouterModule,
        VisualizationModule,
    ]
})
export class WordModelsModule { }
