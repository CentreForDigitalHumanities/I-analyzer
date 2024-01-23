import * as _ from 'lodash';
import { mockCorpus3 } from '../../mock-data/corpus';
import { SimpleStore } from '../store/simple-store';
import { Store } from '../store/types';
import { Corpus } from './corpus';
import { QueryModel } from './query';
import { VisualizationSelector } from './visualization-selector';

describe('VisualizationSelector', () => {
    let store: Store;
    let corpus: Corpus;
    let query: QueryModel;
    let selector: VisualizationSelector;

    beforeEach(() => {
        corpus = _.cloneDeep(mockCorpus3);
        corpus.fields[0].visualizations = ['resultscount', 'termfrequency'];
        corpus.fields[1].visualizations = ['wordcloud'];
        corpus.fields[2].visualizations = ['resultscount', 'termfrequency'];

    });

    beforeEach(() => {
        store = new SimpleStore();
        query = new QueryModel(corpus);
    });

    it('should initialise with default values', () => {
        selector = new VisualizationSelector(store, query);
        expect(selector.state$.value).toEqual({
            name: 'resultscount',
            field: corpus.fields[0]
        });
    });

    it('should intialise from parameters', () => {
        store.paramUpdates$.next({
            visualize: 'wordcloud',
            visualizedField: 'speech'
        });

        selector = new VisualizationSelector(store, query);
        expect(selector.state$.value).toEqual({
            name: 'wordcloud',
            field: corpus.fields[1]
        });
    });

    it('should set the visualisation type', () => {
        selector = new VisualizationSelector(store, query);
        selector.setVisualizationType('termfrequency');
        expect(selector.state$.value).toEqual({
            name: 'termfrequency',
            field: corpus.fields[0]
        });

        selector.setVisualizationType('wordcloud');
        expect(selector.state$.value).toEqual({
            name: 'wordcloud',
            field: corpus.fields[1],
        });
    });

    it('should set the visualisation field', () => {
        selector = new VisualizationSelector(store, query);
        selector.setVisualizedField(corpus.fields[2]);
        expect(selector.state$.value).toEqual({
            name: 'resultscount',
            field: corpus.fields[2],
        });

        selector.setVisualizedField(corpus.fields[1]);
        expect(selector.state$.value).toEqual({
            name: 'wordcloud',
            field: corpus.fields[1],
        });
    });
});
