import { Observable, forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Results } from './results';
import { GeoDocument, GeoLocation } from './search-results';
import { Params } from '@angular/router';
import { VisualizationService } from '@services';
import { Store } from '../store/types';
import { QueryModel } from './query';
import { CorpusField } from './corpus';
import { findByName } from '@utils/utils';


interface MapDataParameters {
    field: CorpusField;
}


interface MapData {
    mapCenter: GeoLocation;
    geoDocuments: GeoDocument[];
}


export class MapDataResults extends Results<MapDataParameters, MapData> {
    private mapCenter: GeoLocation | null = null;

    constructor(
        store: Store,
        query: QueryModel,
        private visualizationService: VisualizationService
    ) {
        super(store, query, ['visualizedField']);
        this.connectToStore();
        this.getResults();
    }

    fetch(): Observable<MapData> {
        const field = this.state$.value.field;
        if (!field) {
            return of({ geoDocuments: [], mapCenter: null });
        }

        const getGeoData$ = this.visualizationService.getGeoData(
            field.name,
            this.query,
            this.query.corpus
        );

        const getGeoCentroid$ = this.mapCenter
            ? of(this.mapCenter)
            : this.visualizationService.getGeoCentroid(field.name, this.query.corpus);

        return forkJoin({
            geoDocuments: getGeoData$,
            mapCenter: getGeoCentroid$
        });
    }

    protected stateToStore(state: MapDataParameters): Params {
        return { visualizedField: state.field?.name || null };
    }

    protected storeToState(params: Params): MapDataParameters {
        const fieldName = params['visualizedField'];
        const field = findByName(this.query.corpus.fields, fieldName);
        return { field };
    }

    protected storeOnComplete(): Params {
        return {};
    }
}
