import { convertToParamMap } from '@angular/router';
import { highlightFromParams, searchFieldsFromParams } from './params';

describe('searchFieldsFromParams', () => {
    it('should parse field parameters', () => {
        const params = convertToParamMap({fields: 'speech,speaker'});
        const fields = searchFieldsFromParams(params);
        expect(fields.length).toEqual(2);
        expect(fields).toContain('speech');
    });
});

describe('highlightFromParams', () => {
    it('should parse highlight parameters', () => {
        const params = convertToParamMap({highlight: '100'});
        const highlight = highlightFromParams(params);
        expect(highlight).toBe(100);
    });
});
