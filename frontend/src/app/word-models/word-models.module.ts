import { NgModule } from '@angular/core';
import { WordModelsComponent } from './word-models.component';
import { VisualizationModule } from '../visualization/visualization.module';
import { QueryFeedbackComponent } from './query-feedback/query-feedback.component';
import { RelatedWordsComponent } from './related-words/related-words.component';
import { WordSimilarityComponent } from './word-similarity/word-similarity.component';
import { SimilarityChartComponent } from './similarity-chart/similarity-chart.component';
import { WordmodelsService } from '../services';
import { TimeIntervalSliderComponent } from './similarity-chart/time-interval-slider/time-interval-slider.component';
import { SharedModule } from '../shared/shared.module';
import { CorpusModule } from '../corpus-header/corpus.module';


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
        CorpusModule,
        SharedModule,
        VisualizationModule,
    ]
})
export class WordModelsModule { }
