import { map, of, Observable, switchMap, withLatestFrom  } from 'rxjs';
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
    private mapCenter$: Observable<GeoLocation>;

    constructor(
        store: Store,
        query: QueryModel,
        private visualizationService: VisualizationService
    ) {
        super(store, query, ['visualizedField']);
        this.connectToStore();
        this.mapCenter$ = this.state$.pipe(
            map(state => state.field),
            switchMap(field => field
                ? this.visualizationService.getGeoCentroid(field.name, this.query.corpus)
                : of(null)
            )
        );
        this.getResults();
    }

    fetch(): Observable<MapData> {
        const field = this.state$.value.field;
        if (!field) {
            return of({ geoDocuments: [], mapCenter: null });
        }

        const geoDocuments$ = this.visualizationService.getGeoData(
            field.name,
            this.query,
            this.query.corpus
        );

        return geoDocuments$.pipe(
            withLatestFrom(this.mapCenter$),
            map(([geoDocuments, mapCenter]) => ({
                geoDocuments,
                mapCenter
            }))
        );
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
