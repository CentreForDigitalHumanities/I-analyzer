import { ParamMap } from '@angular/router';

export const queryFromParams = (params: ParamMap): string =>
    params.get('query');

export const searchFieldsFromParams = (params: ParamMap): string[] | null => {
    if (params.has('fields')) {
        const selectedSearchFields = params.get('fields').split(',');
        return selectedSearchFields;
    }
};

export const highlightFromParams = (params: ParamMap): number =>
    Number(params.get('highlight'));
