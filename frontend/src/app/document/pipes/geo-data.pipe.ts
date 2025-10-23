import { Pipe, PipeTransform } from '@angular/core';
import { CorpusField, FoundDocument } from '@models';
@Pipe({
    name: 'geoData',
    standalone: false
})
export class GeoDataPipe implements PipeTransform {

    /**
     * Transforms GeoJSON data
     *
     * @param document FoundDocument holding the actual data
     */
    transform(field: CorpusField, document: FoundDocument) {
        let latitude = document.fieldValue(field)[field.name][1];
        let longitude = document.fieldValue(field)[field.name][0];
        // Round to 2 decimal places
        latitude = Math.round(latitude * 100) / 100;
        longitude = Math.round(longitude * 100) / 100;
        return `Lat: ${latitude}; Lon: ${longitude}`;
    }

}
